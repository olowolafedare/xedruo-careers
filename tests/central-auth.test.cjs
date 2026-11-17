const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { afterEach, test } = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

process.env.XEDRUO_CENTRAL_AUTH_URL = "https://auth.example.test";
process.env.HIREUO_SESSION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const {
  CentralAuthError,
  centralAuthLogin,
  centralAuthMe,
  centralAuthLogout,
  centralAuthRefresh,
  centralAuthRegister,
  centralAuthGoogleStart,
  centralAuthGoogleExchange,
} = require("../src/lib/auth/central-auth.ts");
const { completeRegistration, completeGoogleLink } = require(
  "../src/lib/auth/registration-flow.ts",
);
const { centralAuthErrorResponse } = require(
  "../src/lib/auth/central-auth-response.ts",
);
const { sealRegistration, openRegistration } = require(
  "../src/lib/auth/registration-cookie.ts",
);

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("pending registration provisions the immutable local identity without a session", async () => {
  const requests = [];
  const accountInputs = [];
  const centralAuthResult = {
    user: {
      id: "immutable-central-id",
      xedruoId: "XED-123",
      status: "pending_google_link",
    },
    registration: {
      status: "pending_google_link",
      continuationToken: "continuation-secret",
    },
  };

  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith("/v1/auth/registration")) {
      return Response.json(centralAuthResult, { status: 201 });
    }
  };

  const result = await completeRegistration(
    {
      phoneNumber: "+2349151045789",
      countryCode: "NG",
      password: "correct-horse-battery",
      displayName: "Ada",
    },
    {
      register: centralAuthRegister,
      ensureAccount: async (identity) => {
        accountInputs.push(identity);
        return { id: "hireuo-account-id" };
      },
    },
  );

  assert.deepEqual(requests.map(({ url }) => url), ["https://auth.example.test/v1/auth/registration"]);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    phoneNumber: "+2349151045789",
    countryCode: "NG",
    password: "correct-horse-battery",
    displayName: "Ada",
  });
  assert.equal(requests[0].init.headers.get("Authorization"), null);
  assert.equal(requests[0].init.redirect, "manual");
  assert.equal(requests[0].init.headers.get("CF-Connecting-IP"), null);
  assert.equal(requests[0].init.headers.get("X-Forwarded-For"), null);
  assert.equal(JSON.stringify(requests[0].init.body).includes("challengeId"), false);
  assert.equal(JSON.stringify(requests[0].init.body).includes("otp"), false);
  assert.deepEqual(accountInputs, [{ id: "immutable-central-id", email: null }]);
  assert.equal(result.accountId, "hireuo-account-id");
  assert.equal(result.centralIdentityId, "immutable-central-id");
  assert.equal(result.continuationToken, "continuation-secret");
  assert.equal(requests[0].init.body.includes("email"), false);
});

test("Google start sends the continuation and exact callback URL", async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url: String(url), init };
    return Response.json({ authorizationUrl: "https://accounts.example.test/authorize" });
  };
  await centralAuthGoogleStart({ continuationToken: "continuation-secret", returnTo: "https://hireuo.example.test/api/v1/auth/google/callback" });
  assert.equal(captured.url, "https://auth.example.test/v1/oauth/google/start");
  assert.deepEqual(JSON.parse(captured.init.body), { continuationToken: "continuation-secret", returnTo: "https://hireuo.example.test/api/v1/auth/google/callback" });
});

test("registration continuation is encrypted and invalid or cleared state cannot be resumed", () => {
  const state = {
    accountId: "hireuo-account-id",
    centralIdentityId: "immutable-central-id",
    continuationToken: "continuation-secret",
  };
  const cookie = sealRegistration(state);
  assert.equal(cookie.includes("continuation-secret"), false);
  const opened = openRegistration(cookie);
  assert.equal(opened.accountId, state.accountId);
  assert.equal(opened.centralIdentityId, state.centralIdentityId);
  assert.equal(opened.continuationToken, state.continuationToken);
  assert.ok(opened.expiresAt > Date.now());
  assert.equal(openRegistration(undefined), null);
  assert.equal(openRegistration("tampered-or-cleared"), null);
});

test("Google completion exchanges code server-side and binds session to the local account", async () => {
  const requests = [];
  const sessions = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith("/v1/oauth/google/exchange")) {
      return Response.json({ tokens: { accessToken: "access-secret", refreshToken: "refresh-secret", tokenType: "Bearer", expiresIn: 900 }, session: { id: "session", expiresAt: "2030-01-01T00:00:00.000Z" } });
    }
    return Response.json({ user: { id: "immutable-central-id", email: "ada@example.com" } });
  };
  await completeGoogleLink("one-time-code", "immutable-central-id", "hireuo-account-id", {
    exchange: centralAuthGoogleExchange,
    getIdentity: centralAuthMe,
    ensureAccount: async (identity) => { assert.equal(identity.id, "immutable-central-id"); return { id: "hireuo-account-id" }; },
    createSession: async (session) => sessions.push(session),
  }, "test-agent");
  assert.deepEqual(requests.map(({ url }) => url), ["https://auth.example.test/v1/oauth/google/exchange", "https://auth.example.test/v1/auth/me"]);
  assert.deepEqual(JSON.parse(requests[0].init.body), { code: "one-time-code" });
  assert.equal(requests[1].init.headers.get("Authorization"), "Bearer access-secret");
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].accountId, "hireuo-account-id");
  assert.equal(sessions[0].refreshToken, "refresh-secret");
});

test("expired or consumed Google completion codes fail without creating a session", async () => {
  for (const status of [410, 409]) {
    let sessions = 0;
    globalThis.fetch = async () => Response.json({ error: "Code is no longer valid" }, { status });
    await assert.rejects(completeGoogleLink("one-time-code", "central-id", "account-id", {
      exchange: centralAuthGoogleExchange,
      getIdentity: centralAuthMe,
      ensureAccount: async () => ({ id: "account-id" }),
      createSession: async () => { sessions += 1; },
    }), (error) => error instanceof CentralAuthError && error.status === status);
    assert.equal(sessions, 0);
  }
});

test("login retains Central Auth invalid-credential status", async () => {
  globalThis.fetch = async () =>
    Response.json({ error: "Invalid credentials" }, { status: 401 });

  await assert.rejects(
    centralAuthLogin("XED-123", "wrong-password"),
    (error) => error instanceof CentralAuthError && error.status === 401,
  );
});

test("redirects are returned manually rather than rejected or followed", async () => {
  let capturedInit;
  globalThis.fetch = async (_url, init) => {
    capturedInit = init;
    return new Response(null, {
      status: 302,
      headers: { Location: "https://auth.example.test/canonical" },
    });
  };

  await assert.rejects(
    centralAuthLogin("XED-123", "safe-test-password"),
    (error) => error instanceof CentralAuthError && error.status === 302,
  );
  assert.equal(capturedInit.redirect, "manual");
});

test("login, refresh, logout, and session validation use the Central Auth contracts", async () => {
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return Response.json({ status: "ok" });
  };

  await centralAuthLogin("XED-123", "safe-test-password");
  await centralAuthRefresh("refresh-token");
  await centralAuthLogout("access-token");
  await centralAuthMe("access-token");

  assert.deepEqual(requests.map(({ url }) => url), [
    "https://auth.example.test/v1/auth/login",
    "https://auth.example.test/v1/auth/refresh",
    "https://auth.example.test/v1/auth/logout",
    "https://auth.example.test/v1/auth/me",
  ]);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    xedruoId: "XED-123",
    password: "safe-test-password",
  });
  assert.deepEqual(JSON.parse(requests[1].init.body), {
    refreshToken: "refresh-token",
  });
  assert.equal(requests[2].init.headers.get("Authorization"), "Bearer access-token");
  assert.equal(requests[3].init.headers.get("Authorization"), "Bearer access-token");
});

test("rate limits preserve 429 and Retry-After in the HIREUO response", async () => {
  globalThis.fetch = async () =>
    Response.json(
      { error: "Rate limited" },
      {
        status: 429,
        headers: {
          "Retry-After": "37",
          "RateLimit-Remaining": "0",
          "X-Internal-Debug": "must not be forwarded",
        },
      },
    );

  let upstreamError;
  try {
    await centralAuthLogin("XED-123", "some-password");
  } catch (error) {
    upstreamError = error;
  }

  assert.ok(upstreamError instanceof CentralAuthError);
  const response = centralAuthErrorResponse(upstreamError);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "37");
  assert.equal(response.headers.get("RateLimit-Remaining"), "0");
  assert.equal(response.headers.get("X-Internal-Debug"), null);
  assert.match((await response.json()).error, /wait before trying again/i);
});

test("upstream failures retain their status and return a safe message", async () => {
  globalThis.fetch = async () =>
    Response.json({ error: "Database internals must stay private" }, { status: 503 });

  let upstreamError;
  try {
    await centralAuthRegister({
      phoneNumber: "+2349151045789",
      countryCode: "NG",
      password: "correct-horse-battery",
      displayName: "Ada",
    });
  } catch (error) {
    upstreamError = error;
  }

  assert.ok(upstreamError instanceof CentralAuthError);
  const response = centralAuthErrorResponse(upstreamError);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /temporarily unavailable/i);
});

test("HTTP 502 diagnostics include safe response metadata and redact personal fields", async () => {
  globalThis.fetch = async () =>
    Response.json(
      {
        error: "Invalid registration request",
        phoneNumber: "+2349151045789",
        email: "ada@example.com",
        accessToken: "secret-access-token",
      },
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "CF-Ray": "abc123-LHR",
          Server: "cloudflare",
        },
      },
    );

  const originalWarn = console.warn;
  let diagnostic;
  console.warn = (_message, details) => {
    diagnostic = details;
  };

  try {
    await assert.rejects(
      centralAuthRegister({
        phoneNumber: "+2349151045789",
        countryCode: "NG",
        password: "never-log-this-password",
        displayName: "Ada",
        email: "ada@example.com",
      }),
      (error) => error instanceof CentralAuthError && error.status === 502,
    );
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(diagnostic.origin, "https://auth.example.test");
  assert.equal(diagnostic.path, "/v1/auth/registration");
  assert.equal(diagnostic.status, 502);
  assert.equal(diagnostic.contentType, "application/json");
  assert.equal(diagnostic.cfRay, "abc123-LHR");
  assert.equal(diagnostic.server, "cloudflare");
  assert.match(diagnostic.bodyPreview, /Invalid registration request/);
  assert.doesNotMatch(diagnostic.bodyPreview, /\+2349151045789|ada@example\.com|secret-access-token/);
});

test("network failures are classified as Central Auth service unavailable", async () => {
  const originalError = new TypeError(
    "fetch failed for https://auth.example.test/v1/auth/login?token=secret-token",
    { cause: new Error("ECONNRESET user@private.example +2349151045789") },
  );
  globalThis.fetch = async () => { throw originalError; };

  const originalErrorLog = console.error;
  let diagnostic;
  console.error = (_message, details) => {
    diagnostic = details;
  };

  let upstreamError;
  try {
    await centralAuthLogin("XED-123", "some-password");
  } catch (error) {
    upstreamError = error;
  } finally {
    console.error = originalErrorLog;
  }

  assert.ok(upstreamError instanceof CentralAuthError);
  assert.equal(upstreamError.status, 502);
  assert.equal(diagnostic.origin, "https://auth.example.test");
  assert.equal(diagnostic.path, "/v1/auth/login");
  assert.equal(diagnostic.error.name, "TypeError");
  assert.equal(diagnostic.cause.name, "Error");
  assert.doesNotMatch(JSON.stringify(diagnostic), /secret-token|user@private\.example|\+2349151045789/);
  const response = centralAuthErrorResponse(upstreamError);
  assert.equal(response.status, 502);
  assert.doesNotMatch((await response.json()).error, /ECONNRESET|secret-token/i);
});
