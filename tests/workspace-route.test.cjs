/* eslint-disable @typescript-eslint/no-require-imports */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const { test } = require("node:test");
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

const state = {
  auth: { account: { id: "authenticated-account" } },
  selectResults: [],
  companies: [],
  memberships: [],
  profiles: [],
  deletedCompanies: [],
  membershipError: null,
};

const schema = {
  companies: { id: "companies.id" },
  companyMemberships: {
    id: "memberships.id",
    accountId: "memberships.accountId",
    status: "memberships.status",
    companyId: "memberships.companyId",
    role: "memberships.role",
  },
  recruiterProfiles: { accountId: "profiles.accountId" },
};

const db = {
  select() {
    return {
      from() {
        return this;
      },
      where() {
        return this;
      },
      limit() {
        return Promise.resolve(state.selectResults.shift() ?? []);
      },
    };
  },
  insert(table) {
    return {
      values(values) {
        if (table === schema.companies) {
          state.companies.push(values);
          return {
            returning: async () => [{ id: `company-${state.companies.length}` }],
          };
        }

        if (table === schema.companyMemberships) {
          if (state.membershipError) throw state.membershipError;
          state.memberships.push(values);
          return Promise.resolve();
        }

        state.profiles.push(values);
        return {
          onConflictDoUpdate: async () => undefined,
        };
      },
    };
  },
  delete() {
    return {
      where: async () => state.deletedCompanies.push(true),
    };
  },
};

const centralAuthError = class CentralAuthError extends Error {};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "next/server") {
    return { NextResponse: { json: (body, init) => Response.json(body, init) } };
  }
  if (request === "drizzle-orm") {
    return {
      and: (...conditions) => conditions,
      eq: (field, value) => ({ field, value }),
    };
  }
  if (request === "@/src/lib/db") return { getDb: () => db };
  if (request === "@/src/lib/db/schema") return schema;
  if (request === "@/src/lib/auth/require-api-user") {
    return { requireApiUser: async () => state.auth };
  }
  if (request === "@/src/lib/auth/central-auth") {
    return { CentralAuthError: centralAuthError };
  }
  if (request === "@/src/lib/auth/central-auth-response") {
    return { withCentralAuthErrors: (handler) => handler };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { POST } = require("../src/app/api/v1/workspace/route.ts");
const aliasRoute = require("../src/app/api/v1/recruiter/workspace/route.ts");

function resetState() {
  state.auth = { account: { id: "authenticated-account" } };
  state.selectResults = [];
  state.companies = [];
  state.memberships = [];
  state.profiles = [];
  state.deletedCompanies = [];
  state.membershipError = null;
}

function request(body) {
  return new Request("https://hireuo.test/api/v1/recruiter/workspace", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validInput = {
  name: "Ada Systems",
  businessEmail: "hiring@ada.example",
  contactPhone: "+234 801 234 5678",
  website: "https://ada.example",
  description: "Hiring team",
  accountId: "attacker-supplied-account",
};

test("recruiter workspace API alias exposes the existing GET and POST handlers", () => {
  assert.equal(aliasRoute.POST, POST);
  assert.equal(typeof aliasRoute.GET, "function");
});

test("workspace creation associates the company with the authenticated account", async () => {
  resetState();
  state.selectResults = [[]];

  const response = await aliasRoute.POST(request(validInput));
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(state.companies.length, 1);
  assert.equal(state.companies[0].createdBy, "authenticated-account");
  assert.equal(state.memberships[0].accountId, "authenticated-account");
  assert.equal(state.memberships[0].companyId, payload.companyId);
  assert.equal(state.memberships[0].role, "owner");
});

test("unauthenticated workspace creation returns JSON 401", async () => {
  resetState();
  state.auth = null;

  const response = await aliasRoute.POST(request(validInput));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication required" });
  assert.equal(state.companies.length, 0);
});

test("invalid workspace details return JSON 400 without database writes", async () => {
  resetState();
  state.selectResults = [[]];

  const response = await aliasRoute.POST(
    request({ ...validInput, businessEmail: "not-an-email" }),
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valid business email/i);
  assert.equal(state.companies.length, 0);
});

test("retries return the existing owner workspace instead of creating a duplicate", async () => {
  resetState();
  state.selectResults = [[], [{ companyId: "existing-company", role: "owner" }]];

  const firstResponse = await aliasRoute.POST(request(validInput));
  await firstResponse.json();
  const retryResponse = await aliasRoute.POST(request(validInput));
  const retryPayload = await retryResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.equal(retryResponse.status, 200);
  assert.equal(retryPayload.companyId, "existing-company");
  assert.equal(state.companies.length, 1);
});

test("concurrent duplicate submission resolves to the active owner workspace", async () => {
  resetState();
  state.selectResults = [[], [{ companyId: "winning-company" }]];
  state.membershipError = {
    code: "23505",
    constraint: "hireuo_company_memberships_one_active_owner_per_account_uidx",
  };

  const response = await aliasRoute.POST(request(validInput));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.companyId, "winning-company");
  assert.equal(state.companies.length, 1);
  assert.equal(state.deletedCompanies.length, 1);
});

process.on("exit", () => {
  Module._load = originalLoad;
});
