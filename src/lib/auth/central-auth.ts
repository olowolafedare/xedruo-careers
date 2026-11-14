
import "server-only";

const AUTH_BASE_URL = process.env.XEDRUO_CENTRAL_AUTH_URL;

export class CentralAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CentralAuthError";
  }
}

function getAuthUrl() {
  if (!AUTH_BASE_URL) {
    throw new Error("XEDRUO_CENTRAL_AUTH_URL is not configured.");
  }

  return AUTH_BASE_URL.replace(/\/+$/, "");
}

async function authRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getAuthUrl()}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new CentralAuthError(
      body?.message || body?.error || "Central Auth request failed.",
      response.status,
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

export interface CentralAuthRegistrationOtpResult {
  challengeId: string;
  expiresAt: string;
  browserOtpCode: string;
  delivery: "browser-popup";
}

export async function centralAuthRequestRegistrationOtp(
  phoneNumber: string,
  countryCode: string,
) {
  return authRequest<CentralAuthRegistrationOtpResult>(
    "/v1/auth/registration/otp",
    {
      method: "POST",
      body: JSON.stringify({ phoneNumber, countryCode }),
    },
  );
}


export interface CentralAuthRegistrationResult {
  tokens: CentralAuthTokens;
  session: {
    id: string;
    expiresAt: string;
  };
}

export async function centralAuthRegister(input: {
  challengeId: string;
  phoneNumber: string;
  countryCode: string;
  otp: string;
  password: string;
  displayName?: string;
  email?: string;
}) {
  return authRequest<CentralAuthRegistrationResult>(
    "/v1/auth/registration",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
