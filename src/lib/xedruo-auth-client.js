export class XedruoAuthError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "XedruoAuthError";
    this.code = code;
    this.status = status;
  }
}

const DEFAULT_AUTH_ORIGIN = "https://xedruo.com";
const b64url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
const randomToken = (size = 32) => {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
};
const sha256 = async (value) =>
  b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
const safePath = (value) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : null;

export function createXedruoAuth({
  companySlug,
  callbackPath = "/auth/callback",
  callbackUrl: callbackUrlOverride,
  authOrigin = DEFAULT_AUTH_ORIGIN,
  storage = typeof window !== "undefined" ? window.sessionStorage : null,
}) {
  if (!companySlug) throw new Error("companySlug is required.");
  if (typeof window === "undefined" || !storage) throw new Error("XedruoAuth must be initialized in a browser.");

  const slug = String(companySlug).trim().toLowerCase();
  const api = authOrigin.replace(/\/$/, "") + "/api/auth";
  const key = "xedruo.central." + slug;
  const verifierKey = key + ".pkce";
  const stateKey = key + ".oauth-state";
  const returnKey = key + ".return";
  const callbackUrl = callbackUrlOverride || new URL(callbackPath, window.location.origin).toString();

  const read = () => {
    try { return JSON.parse(storage.getItem(key) || "null"); } catch { return null; }
  };
  const save = (session) => storage.setItem(key, JSON.stringify(session));
  const clear = () => storage.removeItem(key);

  async function request(path, { method = "GET", token, body } = {}) {
    let response;
    try {
      response = await fetch(api + path, {
        method,
        headers: {
          "x-xedruo-company": slug,
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        ...(body ? { body: JSON.stringify({ ...body, companySlug: slug }) } : {}),
        cache: "no-store",
      });
    } catch {
      throw new XedruoAuthError("network_error", "Could not reach Xedruo authentication.", 0);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new XedruoAuthError(data.error || "request_failed", data.message || "Authentication request failed.", response.status);
    }
    return data;
  }

  async function signInWithGoogle({ returnTo } = {}) {
    const verifier = randomToken(32);
    const state = randomToken(32);
    const challenge = await sha256(verifier);
    storage.setItem(verifierKey, verifier);
    storage.setItem(stateKey, state);
    const path = safePath(returnTo);
    if (path) storage.setItem(returnKey, path);
    else storage.removeItem(returnKey);

    const result = await request("/google/start", {
      method: "POST",
      body: { callbackUrl, state, codeChallenge: challenge },
    });
    if (!result.authorization_url) {
      throw new XedruoAuthError("invalid_oauth_response", "Xedruo did not return Google's sign-in URL.", 502);
    }
    window.location.assign(result.authorization_url);
  }

  async function handleCallback() {
    const url = new URL(window.location.href);
    const googleCode = url.searchParams.get("code");
    const googleState = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
    if (oauthError) {
      throw new XedruoAuthError("oauth_failed", "Google sign-in was cancelled or could not be completed.", 400);
    }
    if (!googleCode || !googleState) {
      throw new XedruoAuthError("missing_callback_data", "Google did not return the required sign-in code and state.", 400);
    }

    const verifier = storage.getItem(verifierKey);
    const expectedState = storage.getItem(stateKey);
    if (!verifier || !expectedState) {
      throw new XedruoAuthError("oauth_state_missing", "This sign-in session expired. Please start again.", 400);
    }

    const completed = await request("/google/complete", {
      method: "POST",
      body: { code: googleCode, state: googleState, callbackUrl },
    });
    if (!completed.code || completed.state !== expectedState || completed.callbackUrl !== callbackUrl) {
      throw new XedruoAuthError("oauth_state_invalid", "The sign-in response could not be verified. Please start again.", 400);
    }

    const result = await request("/oauth/exchange", {
      method: "POST",
      body: { code: completed.code, codeVerifier: verifier, callbackUrl },
    });
    const session = result.session;
    if (!session?.access_token || !session?.refresh_token) {
      throw new XedruoAuthError("invalid_session", "Xedruo did not return a valid company session.", 502);
    }

    save({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: Date.now() + Number(session.expires_in || 900) * 1000,
    });
    storage.removeItem(verifierKey);
    storage.removeItem(stateKey);
    window.history.replaceState({}, "", url.pathname);
    return { ...session, returnTo: safePath(storage.getItem(returnKey)) };
  }

  async function getAccess() {
    let session = read();
    if (!session?.access_token) {
      throw new XedruoAuthError("unauthenticated", "Sign in required.", 401);
    }
    if (session.expires_at && session.expires_at <= Date.now() + 30000) {
      const rotated = await request("/session/refresh", {
        method: "POST",
        body: { refreshToken: session.refresh_token },
      });
      if (!rotated.session?.access_token || !rotated.session?.refresh_token) {
        clear();
        throw new XedruoAuthError("invalid_refresh_token", "Your session expired. Please sign in again.", 401);
      }
      session = {
        access_token: rotated.session.access_token,
        refresh_token: rotated.session.refresh_token,
        expires_at: Date.now() + Number(rotated.session.expires_in || 900) * 1000,
      };
      save(session);
    }
    return request("/session/validate", { method: "POST", token: session.access_token, body: {} });
  }

  async function onboard({ countryCode, phoneE164, legalName }) {
    const session = read();
    if (!session?.access_token) {
      throw new XedruoAuthError("unauthenticated", "Sign in required.", 401);
    }
    return request("/identity/onboarding", {
      method: "POST",
      token: session.access_token,
      body: { countryCode, phoneE164, legalName },
    });
  }

  async function signOut() {
    const session = read();
    try {
      if (session?.access_token) {
        await request("/session/logout", { method: "POST", token: session.access_token, body: {} });
      }
    } finally {
      clear();
      storage.removeItem(verifierKey);
      storage.removeItem(stateKey);
      storage.removeItem(returnKey);
    }
  }

  return {
    companySlug: slug,
    callbackUrl,
    signInWithGoogle,
    handleCallback,
    getAccess,
    onboard,
    signOut,
    getSession: () => read(),
    consumeReturnTo: () => {
      const path = safePath(storage.getItem(returnKey));
      storage.removeItem(returnKey);
      return path;
    },
  };
}
