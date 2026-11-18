const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

process.env.HIREUO_SESSION_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");

function makeHarness() {
  const rows = new Map();
  const writes = [];
  let cookieError = null;
  const schema = {
    accounts: { id: "accounts.id" },
    sessions: {
      id: "sessions.id",
      accountId: "sessions.accountId",
      sessionTokenHash: "sessions.sessionTokenHash",
      revokedAt: "sessions.revokedAt",
      expiresAt: "sessions.expiresAt",
      authMode: "sessions.authMode",
    },
  };
  const condition = (field, value) => ({ field, value });
  const db = {
    insert: () => ({
      values: (value) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (rows.has(value.sessionTokenHash)) return [];
            const row = { ...value, id: `session-${rows.size + 1}`, revokedAt: null };
            rows.set(value.sessionTokenHash, row);
            return [{ id: row.id }];
          },
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: (where) => ({
          limit: async () => {
            const row = [...rows.values()].find((candidate) => candidate[where.field.split(".").at(-1)] === where.value);
            return row ? [{ id: row.id, accountId: row.accountId, revokedAt: row.revokedAt, expiresAt: row.expiresAt }] : [];
          },
        }),
      }),
    }),
    update: () => ({
      set: (values) => ({
        where: async (where) => {
          const row = [...rows.values()].find((candidate) => candidate.id === where.value);
          if (row) Object.assign(row, values);
        },
      }),
    }),
  };
  const cookieStore = {
    set: (...args) => {
      if (cookieError) throw cookieError;
      writes.push(args);
    },
  };
  const originalLoad = Module._load;
  delete require.cache[require.resolve("../src/lib/auth/session-store.ts")];
  Module._load = function (request, parent, isMain) {
    if (parent?.filename.endsWith(`${path.sep}src${path.sep}lib${path.sep}auth${path.sep}session-store.ts`)) {
      if (request === "next/headers") return { cookies: async () => cookieStore };
      if (request === "drizzle-orm") return { and: () => ({}), eq: condition, gt: () => ({}), isNotNull: () => ({}), isNull: () => ({}), lte: () => ({}), or: () => ({}) };
      if (request === "../db") return { getDb: () => db };
      if (request === "../db/schema") return schema;
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  let sessionStore;
  try {
    sessionStore = require("../src/lib/auth/session-store.ts");
  } finally {
    Module._load = originalLoad;
  }
  return {
    sessionStore,
    rows,
    writes,
    setCookieError(error) { cookieError = error; },
  };
}

function sessionInput(idempotencyKey) {
  return {
    accountId: "hireuo-account-id",
    accessToken: "access-secret",
    refreshToken: "refresh-secret",
    accessTokenExpiresAt: new Date(Date.now() + 60_000),
    expiresAt: new Date(Date.now() + 60 * 60_000),
    idempotencyKey,
  };
}

test("concurrent callback session writes share one database session and one opaque cookie", async () => {
  const harness = makeHarness();
  await Promise.all([
    harness.sessionStore.createSession(sessionInput("registration-key")),
    harness.sessionStore.createSession(sessionInput("registration-key")),
  ]);
  assert.equal(harness.rows.size, 1);
  assert.equal(harness.writes.length, 2);
  assert.equal(harness.writes[0][1], harness.writes[1][1]);
});

test("a failed cookie write revokes a newly inserted session", async () => {
  const harness = makeHarness();
  harness.setCookieError(new Error("cookie write failed"));
  await assert.rejects(
    harness.sessionStore.createSession(sessionInput("registration-key")),
    /cookie write failed/,
  );
  assert.equal(harness.rows.size, 1);
  assert.ok([...harness.rows.values()][0].revokedAt instanceof Date);
});

test("local application Google session stores no fabricated Central tokens", async () => {
  const harness = makeHarness();
  await harness.sessionStore.createSession({
    accountId: "hireuo-account-id",
    authMode: "local_application_google",
    expiresAt: new Date(Date.now() + 60 * 60_000),
  });
  const stored = [...harness.rows.values()][0];
  assert.equal(stored.authMode, "local_application_google");
  assert.equal(stored.accessTokenEncrypted, null);
  assert.equal(stored.refreshTokenEncrypted, null);
  assert.equal(stored.accessTokenExpiresAt, null);
});

test("a revoked orphan is not resurrected by a later callback", async () => {
  const harness = makeHarness();
  harness.setCookieError(new Error("cookie write failed"));
  await assert.rejects(harness.sessionStore.createSession(sessionInput("registration-key")));
  harness.setCookieError(null);
  await assert.rejects(
    harness.sessionStore.createSession(sessionInput("registration-key")),
    /Unable to create an idempotent HIREUO session/,
  );
  assert.equal(harness.rows.size, 1);
  assert.ok([...harness.rows.values()][0].revokedAt instanceof Date);
  assert.equal(harness.writes.length, 0);
});
