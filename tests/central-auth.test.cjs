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

const {
  CentralAuthError,
  centralAuthLogin,
  centralAuthMe,
  centralAuthLogout,
  centralAuthRefresh,
  centralAuthRegister,
} = require("../src/lib/auth/central-auth.ts");
const { completeRegistration } = require(
  "../src/lib/auth/registration-flow.ts",
);
const { centralAuthErrorResponse } = require(
  "../src/lib/auth/central-auth-response.ts",
);

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("successful registration provisions the local account and session", async () => {
  const requests = [];
  const accountInputs = [];
  const createdSessions = [];
  const centralAuthResult = {
    tokens: {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
    },
    session: { id: "session-id", expiresAt: "2030-01-01T00:00:00.000Z" },
  };

  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith("/v1/auth/registration")) {
      return Response.json(centralAuthResult, { status: 201 });
    }
    return Response.json({
      user: { id: "identity-id", email: "ada@example.com" },
    });
  };

  await completeRegistration(
    {
      phoneNumber: "+2349151045789",
      countryCode: "NG",
      password: "correct-horse-battery",
      displayName: "Ada",
      email: "ada@example.com",
    },
    {
      register: centralAuthRegister,
      getIdentity: centralAuthMe,
      ensureAccount: async (identity) => {
        accountInputs.push(identity);
        return { id: "hireuo-account-id" };
      },
      createSession: async (session) => createdSessions.push(session),
    },
    "integration-test-agent",
  );

  assert.deepEqual(requests.map(({ url }) => url), [
    "https://auth.example.test/v1/auth/registration",
    "https://auth.example.test/v1/auth/me",
  ]);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    phoneNumber: "+2349151045789",
    countryCode: "NG",
    password: "correct-horse-battery",
    displayName: "Ada",
    email: "ada@example.com",
  });
  assert.equal(requests[0].init.headers.get("Authorization"), null);
  assert.equal(requests[0].init.headers.get("CF-Connecting-IP"), null);
  assert.equal(requests[0].init.headers.get("X-Forwarded-For"), null);
  assert.equal(JSON.stringify(requests[0].init.body).includes("challengeId"), false);
  assert.equal(JSON.stringify(requests[0].init.body).includes("otp"), false);
  assert.equal(requests[1].init.headers.get("Authorization"), "Bearer access-token");
  assert.deepEqual(accountInputs, [{ id: "identity-id", email: "ada@example.com" }]);
  assert.equal(createdSessions.length, 1);
  assert.equal(createdSessions[0].accountId, "hireuo-account-id");
  assert.equal(createdSessions[0].accessToken, "access-token");
  assert.equal(createdSessions[0].refreshToken, "refresh-token");
  assert.equal(createdSessions[0].expiresAt.toISOString(), "2030-01-01T00:00:00.000Z");
  assert.equal(createdSessions[0].userAgent, "integration-test-agent");
});

test("login retains Central Auth invalid-credential status", async () => {
  globalThis.fetch = async () =>
    Response.json({ error: "Invalid credentials" }, { status: 401 });

  await assert.rejects(
    centralAuthLogin("XED-123", "wrong-password"),
    (error) => error instanceof CentralAuthError && error.status === 401,
  );
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

test("network failures are classified as Central Auth service unavailable", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("socket details should not reach the response");
  };

  let upstreamError;
  try {
    await centralAuthLogin("XED-123", "some-password");
  } catch (error) {
    upstreamError = error;
  }

  assert.ok(upstreamError instanceof CentralAuthError);
  assert.equal(upstreamError.status, 502);
  const response = centralAuthErrorResponse(upstreamError);
  assert.equal(response.status, 502);
  assert.doesNotMatch((await response.json()).error, /socket details/i);
});
