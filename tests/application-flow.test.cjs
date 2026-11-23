const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
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

function loadWithMocks(file, mocks) {
  const resolved = require.resolve(file);
  delete require.cache[resolved];
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (parent?.filename === resolved && Object.hasOwn(mocks, request)) {
      return mocks[request];
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(resolved);
  } finally {
    Module._load = originalLoad;
  }
}

test("auth return destinations allow job application continuation but reject external paths", () => {
  const { getSafeAuthReturnTo } = require("../src/lib/auth/safe-return-to.ts");

  assert.equal(getSafeAuthReturnTo("/jobs/product-manager-123?apply=1"), "/jobs/product-manager-123?apply=1");
  assert.equal(
    getSafeAuthReturnTo("/applicant?next=%2Fjobs%2Frole-123%3Fapply%3D1"),
    "/applicant?next=%2Fjobs%2Frole-123%3Fapply%3D1",
  );
  assert.equal(getSafeAuthReturnTo("//attacker.example"), "/portal-selection");
  assert.equal(getSafeAuthReturnTo("/jobs/%2f%2fattacker"), "/portal-selection");
  assert.equal(getSafeAuthReturnTo("/jobs/role-123?next=https://attacker.example"), "/portal-selection");
  assert.equal(getSafeAuthReturnTo("/start"), "/portal-selection");
});

test("application API rejects unauthenticated requests using the HIREUO session guard", async () => {
  const { POST } = loadWithMocks(
    "../src/app/api/v1/applications/route.ts",
    {
      "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
      "drizzle-orm": { and: () => ({}), desc: () => ({}), eq: () => ({}) },
      "@/src/lib/db": { getDb: () => { throw new Error("Database should not be queried"); } },
      "@/src/lib/db/schema": {},
      "@/src/lib/auth/require-api-user": { requireApiUser: async () => null },
      "@/src/lib/auth/central-auth-response": { withCentralAuthErrors: (handler) => handler },
    },
  );

  const response = await POST({ json: async () => ({ job_id: "job-id" }) });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication required" });
});

test("application API requires a completed candidate profile after authenticating the session", async () => {
  const schema = {
    applications: { id: "application.id", jobId: "application.jobId", candidateAccountId: "application.accountId" },
    applicationStatusHistory: {},
    candidateProfiles: { accountId: "candidate.accountId", onboardingCompleted: "candidate.onboardingCompleted" },
    companyMemberships: {},
    jobs: { id: "job.id", title: "job.title", companyId: "job.companyId", status: "job.status", expiresAt: "job.expiresAt", applicationDeadline: "job.applicationDeadline" },
    notifications: {},
  };
  let inserted = false;
  const db = {
    select: () => {
      let table;
      const query = {
        from(value) {
          table = value;
          return query;
        },
        where() {
          return query;
        },
        limit: async () => {
          if (table === schema.jobs) {
            return [{
              id: "job-id",
              title: "Role",
              companyId: "company-id",
              status: "published",
              expiresAt: new Date(Date.now() + 60_000),
              applicationDeadline: null,
            }];
          }
          if (table === schema.candidateProfiles) return [];
          throw new Error("Unexpected table queried");
        },
      };
      return query;
    },
    insert: () => {
      inserted = true;
      throw new Error("Application must not be inserted");
    },
  };

  const { POST } = loadWithMocks(
    "../src/app/api/v1/applications/route.ts",
    {
      "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
      "drizzle-orm": { and: () => ({}), desc: () => ({}), eq: () => ({}) },
      "@/src/lib/db": { getDb: () => db },
      "@/src/lib/db/schema": schema,
      "@/src/lib/auth/require-api-user": {
        requireApiUser: async () => ({ account: { id: "account-id" } }),
      },
      "@/src/lib/auth/central-auth-response": { withCentralAuthErrors: (handler) => handler },
    },
  );

  const response = await POST({ json: async () => ({ job_id: "job-id" }) });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: "Complete your candidate profile before applying.",
    code: "candidate_profile_required",
  });
  assert.equal(inserted, false);
});
