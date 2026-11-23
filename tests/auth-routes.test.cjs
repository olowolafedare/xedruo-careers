const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

process.env.HIREUO_SESSION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

function loadWithMocks(file, mocks) {
  const resolved = require.resolve(file);
  delete require.cache[resolved];
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (parent?.filename === resolved && Object.hasOwn(mocks, request)) return mocks[request];
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(resolved);
  } finally {
    Module._load = originalLoad;
  }
}

const nextServer = { NextResponse: { json: (body, init) => Response.json(body, init) } };

test("password login only creates a session for the verified Central Auth identity", async () => {
  const sessions = [];
  let identityId = "central-user-id";
  const { POST } = loadWithMocks("../src/app/api/v1/auth/login/route.ts", {
    "next/server": nextServer,
    "../../../../../lib/auth/central-auth": {
      centralAuthLogin: async () => ({
        user: { id: "central-user-id" },
        tokens: { accessToken: "access", refreshToken: "refresh", expiresIn: 900 },
        session: { expiresAt: "2030-01-01T00:00:00.000Z" },
      }),
      centralAuthMe: async () => ({ user: { id: identityId, email: null } }),
      CentralAuthError: class CentralAuthError extends Error {},
    },
    "../../../../../lib/auth/central-auth-response": { centralAuthErrorResponse: () => Response.json({}, { status: 401 }) },
    "../../../../../lib/auth/account-store": { ensureLocalAccount: async () => ({ id: "hireuo-account-id" }) },
    "../../../../../lib/auth/session-store": { createSession: async (value) => sessions.push(value) },
  });
  const request = { json: async () => ({ xedruoId: "XED-123", password: "test-password" }), headers: new Headers() };

  const success = await POST(request);
  assert.equal(success.status, 200);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].accountId, "hireuo-account-id");

  identityId = "different-central-user";
  const mismatch = await POST(request);
  assert.equal(mismatch.status, 401);
  assert.equal(sessions.length, 1);
});

test("application Google callback exchanges only a completion code with the matching pending state", async () => {
  const { createApplicationGoogleLoginTransaction } = require(
    "../src/lib/auth/application-google-login-cookie.ts",
  );
  const { encryptToken } = require("../src/lib/auth/token-crypto.ts");
  const { transaction } = createApplicationGoogleLoginTransaction();
  const sealed = encryptToken(JSON.stringify({
    ...transaction,
    returnTo: "/candidate/dashboard",
  }));
  const exchanges = [];
  const accounts = [];
  const sessions = [];
  const cookieWrites = [];
  const responseWithCookies = (response) => {
    response.cookies = { set: (...args) => cookieWrites.push(args) };
    return response;
  };
  const { GET } = loadWithMocks(
    "../src/app/api/v1/auth/google/login/callback/route.ts",
    {
      "next/server": {
        NextResponse: {
          redirect: (url) => responseWithCookies(new Response(null, {
            status: 307,
            headers: { location: String(url) },
          })),
        },
      },
      "../../../../../../../lib/auth/central-auth": {
        centralAuthApplicationGoogleExchange: async (code) => {
          exchanges.push(code);
          return { identity: { id: "immutable-central-id" } };
        },
        CentralAuthError: class CentralAuthError extends Error {},
      },
      "../../../../../../../lib/auth/account-store": {
        ensureLocalAccount: async (identity) => {
          accounts.push(identity);
          return { id: "hireuo-account-id" };
        },
      },
      "../../../../../../../lib/auth/session-store": {
        createSession: async (session) => sessions.push(session),
      },
      "../../../../../../../lib/auth/registration-cookie": {
        getHireuoOrigin: () => "https://hireuo.example.test",
      },
    },
  );

  const makeRequest = (state) => ({
    nextUrl: new URL(`https://hireuo.example.test/api/v1/auth/google/login/callback?code=completion-code&state=${encodeURIComponent(state ?? "")}`),
    cookies: { get: () => ({ value: sealed }) },
    headers: new Headers({ "user-agent": "test-agent" }),
  });

  const rejected = await GET(makeRequest("attacker-state-value-0000000000"));
  assert.equal(rejected.status, 307);
  assert.deepEqual(exchanges, []);
  assert.deepEqual(accounts, []);
  assert.deepEqual(sessions, []);

  const accepted = await GET(makeRequest(transaction.state));
  assert.equal(accepted.status, 307);
  assert.equal(exchanges.length, 1);
  assert.deepEqual(accounts, [{ id: "immutable-central-id", email: null }]);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].accountId, "hireuo-account-id");
  assert.equal(sessions[0].authMode, "local_application_google");
  const callbackDestination = new URL(accepted.headers.get("location"));
  assert.equal(callbackDestination.pathname, "/portal-selection");
  assert.equal(callbackDestination.search, "");
  assert.equal(cookieWrites.length, 2);
  assert.equal(cookieWrites[1][1], "");
});

test("session validation rejects mismatched Central Auth identities and revokes the local session", async () => {
  let revoked = 0;
  const { requireApiUser } = loadWithMocks("../src/lib/auth/require-api-user.ts", {
    "./central-auth": {
      centralAuthMe: async () => ({ user: { id: "different-central-user" } }),
      centralAuthRefresh: async () => { throw new Error("unexpected refresh"); },
      CentralAuthError: class CentralAuthError extends Error {},
    },
    "./session-store": {
      getCurrentSession: async () => ({
        account: { id: "hireuo-account-id", xedruoIdentityId: "central-user-id" },
        session: { id: "session-id", accessToken: "access", refreshToken: "refresh", accessTokenExpiresAt: new Date(Date.now() + 300_000), expiresAt: new Date(Date.now() + 600_000) },
      }),
      updateSessionTokens: async () => {},
      revokeCurrentSession: async () => { revoked += 1; },
    },
  });

  assert.equal(await requireApiUser(), null);
  assert.equal(revoked, 1);
});

test("logout revokes the HIREUO session even when Central Auth logout fails", async () => {
  let revoked = 0;
  class FakeCentralAuthError extends Error {
    constructor() { super("upstream unavailable"); this.status = 503; this.retryAfter = null; this.rateLimitHeaders = {}; }
  }
  const { POST } = loadWithMocks("../src/app/api/v1/auth/logout/route.ts", {
    "next/server": nextServer,
    "../../../../../lib/auth/central-auth": {
      centralAuthLogout: async () => { throw new FakeCentralAuthError(); },
      CentralAuthError: FakeCentralAuthError,
    },
    "../../../../../lib/auth/central-auth-response": {
      centralAuthErrorResponse: (error) => Response.json({ status: error.status }, { status: error.status }),
    },
    "../../../../../lib/auth/session-store": {
      getCurrentSession: async () => ({ session: { authMode: "central_auth", accessToken: "access" } }),
      revokeCurrentSession: async () => { revoked += 1; },
    },
  });

  const response = await POST();
  assert.equal(response.status, 503);
  assert.equal(revoked, 1);
});
