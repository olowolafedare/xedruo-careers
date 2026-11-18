import "server-only";

const AUTH_BASE_URL = process.env.XEDRUO_CENTRAL_AUTH_URL;

export class CentralAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfter: string | null = null,
    public readonly rateLimitHeaders: Readonly<Record<string, string>> = {},
  ) {
    super(message);
    this.name = "CentralAuthError";
  }
}

function getAuthUrl() {
  if (!AUTH_BASE_URL) {
    throw new Error("XEDRUO_CENTRAL_AUTH_URL is not configured.");
  }

  const url = new URL(AUTH_BASE_URL);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("Central Auth must use HTTPS in production.");
  }

  return url.toString().replace(/\/+$/, "");
}

function safeEndpoint(url: URL | null, fallbackPath: string) {
  return url
    ? { origin: url.origin, path: url.pathname }
    : { origin: "unconfigured", path: fallbackPath.split("?", 1)[0] };
}

function collectSensitiveRequestValues(options: RequestInit, headers: Headers) {
  const values = new Set<string>();
  const inspect = (value: unknown, key = "") => {
    if (/phone|email|password|token|secret|authorization|credential|cookie|display.?name|(?:^|_)code$/i.test(key)) {
      if (typeof value === "string" && value.length >= 3) values.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => inspect(item));
    } else if (value && typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) => inspect(childValue, childKey));
    }
  };

  if (typeof options.body === "string") {
    try {
      inspect(JSON.parse(options.body));
    } catch {
      // Bodies from these callers are JSON; ignore anything else for diagnostics.
    }
  }

  const authorization = headers.get("Authorization");
  if (authorization) {
    values.add(authorization);
    const [, credential] = authorization.split(/\s+/, 2);
    if (credential) values.add(credential);
  }

  return [...values].sort((left, right) => right.length - left.length);
}

function redactText(value: string, sensitiveValues: readonly string[] = []) {
  let redacted = value;
  for (const sensitiveValue of sensitiveValues) {
    redacted = redacted.replace(
      new RegExp(sensitiveValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      "[redacted]",
    );
  }

  return redacted
    .replace(/https?:\/\/[^\s"'<>]+/gi, (candidate) => {
      try {
        const url = new URL(candidate);
        return `${url.origin}${url.pathname}`;
      } catch {
        return "[redacted-url]";
      }
    })
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(/\b(password|access[_-]?token|refresh[_-]?token|token|secret|authorization)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi, "$1=[redacted]")
    .replace(/(?<!\w)\+?\d[\d\s().-]{5,}\d(?!\w)/g, "[redacted-number]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[redacted-ip]");
}

function redactBodyPreview(body: string, sensitiveValues: readonly string[]) {
  let preview = body;

  try {
    const parsed: unknown = JSON.parse(body);
    const redactValue = (value: unknown, key = ""): unknown => {
      if (/phone|email|password|token|secret|authorization|credential|cookie|identity|display.?name|(?:^|_)code$/i.test(key)) {
        return "[redacted]";
      }
      if (Array.isArray(value)) return value.map((item) => redactValue(item));
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([childKey, childValue]) => [
            childKey,
            redactValue(childValue, childKey),
          ]),
        );
      }
      return typeof value === "string" ? redactText(value, sensitiveValues) : value;
    };
    preview = JSON.stringify(redactValue(parsed));
  } catch {
    preview = redactText(body, sensitiveValues);
  }

  return preview.slice(0, 400);
}

function describeFetchFailure(error: unknown, sensitiveValues: readonly string[]) {
  const describe = (value: unknown) => {
    if (value instanceof Error) {
      return { name: value.name, message: redactText(value.message, sensitiveValues) };
    }
    if (typeof value === "string") return { message: redactText(value, sensitiveValues) };
    if (value && typeof value === "object" && "message" in value) {
      const name = "name" in value && typeof value.name === "string"
        ? value.name
        : undefined;
      const message = typeof value.message === "string"
        ? redactText(value.message, sensitiveValues)
        : "[unavailable]";
      return { ...(name ? { name } : {}), message };
    }
    return value === undefined ? undefined : { type: typeof value };
  };

  if (error instanceof Error) {
    return {
      error: describe(error),
      ...(error.cause !== undefined ? { cause: describe(error.cause) } : {}),
    };
  }
  return { error: describe(error) };
}

async function authRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const sensitiveValues = collectSensitiveRequestValues(options, headers);
  const requestMetadata = {
    method: (options.method ?? "GET").toUpperCase(),
    contentType: headers.get("Content-Type"),
    requestHeaderNames: [...headers.keys()].sort(),
  };

  let response: Response;
  let requestUrl: URL | null = null;

  try {
    const target = `${getAuthUrl()}${path}`;
    requestUrl = new URL(target);
    response = await fetch(target, {
      ...options,
      headers,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    console.error("HIREUO Central Auth fetch exception:", {
      ...safeEndpoint(requestUrl, path),
      ...requestMetadata,
      ...describeFetchFailure(error, sensitiveValues),
    });
    throw new CentralAuthError("Central Auth service is unavailable.", 502);
  }

  const responseBody = await response.text().catch(() => "");
  const contentType = response.headers.get("Content-Type");
  const responseMetadata = {
    ...safeEndpoint(requestUrl, path),
    ...requestMetadata,
    status: response.status,
    contentType,
    cfRay: response.headers.get("CF-Ray"),
    server: response.headers.get("Server"),
  };

  if (!response.ok) {
    console.warn("HIREUO Central Auth upstream error response:", {
      ...responseMetadata,
      bodyPreview: redactBodyPreview(responseBody, sensitiveValues),
    });
  } else {
    console.info("HIREUO Central Auth upstream response:", responseMetadata);
  }

  let body: { message?: unknown; error?: unknown } | null = null;
  try {
    const parsed: unknown = responseBody ? JSON.parse(responseBody) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      body = parsed as { message?: unknown; error?: unknown };
    }
  } catch {
    body = null;
  }

  if (!response.ok) {
    const rateLimitHeaders: Record<string, string> = {};
    for (const name of [
      "RateLimit",
      "RateLimit-Policy",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ]) {
      const value = response.headers.get(name);
      if (value) rateLimitHeaders[name] = value;
    }

    throw new CentralAuthError(
      (typeof body?.message === "string" && body.message) ||
        (typeof body?.error === "string" && body.error) ||
        "Central Auth request failed.",
      response.status,
      response.headers.get("Retry-After"),
      rateLimitHeaders,
    );
  }

  return body as T;
}

export interface CentralAuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface CentralAuthLoginResult {
  user: {
    id: string;
    xedruoId: string;
    phoneVerified: boolean;
    verificationMethod: string | null;
  };
  tokens: CentralAuthTokens;
  session: {
    id: string;
    expiresAt: string;
  };
}

export interface CentralAuthMeResult {
  user: {
    id: string;
    xedruo_id: string;
    country_code: string | null;
    phone_e164: string | null;
    phone_verified_at: string | null;
    phone_verification_method: string | null;
    status: string;
    created_at: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export async function centralAuthLogin(
  xedruoId: string,
  password: string,
) {
  return authRequest<CentralAuthLoginResult>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ xedruoId, password }),
  });
}

export async function centralAuthMe(accessToken: string) {
  return authRequest<CentralAuthMeResult>("/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function centralAuthRefresh(refreshToken: string) {
  return authRequest<CentralAuthTokens>("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function centralAuthLogout(accessToken: string) {
  return authRequest<{ status: string }>("/v1/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export interface CentralAuthRegistrationResult {
  user: {
    id: string;
    xedruoId: string;
    status: "pending_google_link";
  };
  registration: {
    status: "pending_google_link";
    continuationToken: string;
  };
}

export interface CentralAuthGoogleStartResult {
  authorizationUrl: string;
}

export interface CentralAuthGoogleExchangeResult {
  tokens: CentralAuthTokens;
  session: {
    id: string;
    expiresAt: string;
  };
}

export async function centralAuthRegister(input: {
  phoneNumber: string;
  countryCode: string;
  password: string;
  displayName: string;
}) {
  const { phoneNumber, countryCode, password, displayName } = input;
  return authRequest<CentralAuthRegistrationResult>(
    "/v1/auth/registration",
    {
      method: "POST",
      body: JSON.stringify({ phoneNumber, countryCode, password, displayName }),
    },
  );
}

export async function centralAuthGoogleStart(input: {
  continuationToken: string;
  returnTo: string;
}) {
  return authRequest<CentralAuthGoogleStartResult>("/v1/oauth/google/start", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function centralAuthGoogleExchange(code: string) {
  return authRequest<CentralAuthGoogleExchangeResult>("/v1/oauth/google/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export interface CentralAuthApplicationGoogleExchangeResult {
  identity: {
    id: string;
  };
}

function getApplicationApiKey() {
  const apiKey = process.env.XEDRUO_CENTRAL_AUTH_API_KEY;
  if (!apiKey) {
    throw new Error("XEDRUO_CENTRAL_AUTH_API_KEY is not configured.");
  }
  return apiKey;
}

export async function centralAuthApplicationGoogleStart(
  callbackUri: string,
  state: string,
) {
  return authRequest<CentralAuthGoogleStartResult>(
    "/v1/oauth/google/application/start",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApplicationApiKey()}`,
      },
      body: JSON.stringify({ callbackUri, state }),
    },
  );
}

export async function centralAuthApplicationGoogleExchange(code: string) {
  return authRequest<CentralAuthApplicationGoogleExchangeResult>(
    "/v1/oauth/google/application/exchange",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApplicationApiKey()}`,
      },
      body: JSON.stringify({ code }),
    },
  );
}
