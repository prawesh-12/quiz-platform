import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

import {
  createClient,
  adminCredentials,
  teacherCredentials,
  gatewayUnreachable,
  requireEnv
} from "../helpers/client.js";

async function loginAs(role, creds) {
  const client = createClient();
  const res = await client.post("/api/auth/login", { ...creds, role });
  assert.equal(res.status, 200, `${role} login failed (${res.status})`);
  return client;
}

function assertSubjectList(res) {
  assert.equal(res.status, 200);
  const list = Array.isArray(res.data) ? res.data : res.data?.subjects ?? res.data?.data;
  assert.ok(Array.isArray(list), "expected a subjects array in the response");
}

describe("subject list endpoints", () => {
  let offline = null;

  before(async () => {
    offline = await gatewayUnreachable();
  });

  it("requires auth on /api/subjects", async (t) => {
    if (offline) return t.skip(offline);
    const res = await createClient().get("/api/subjects");
    assert.equal(res.status, 401);
  });

  describe("admin", () => {
    let skipReason = null;
    before(() => {
      skipReason = offline || requireEnv("TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD");
    });

    it("lists subjects via /api/admin/subjects", async (t) => {
      if (skipReason) return t.skip(skipReason);
      const client = await loginAs("admin", adminCredentials());
      assertSubjectList(await client.get("/api/admin/subjects"));
    });

    it("lists subjects via /api/subjects", async (t) => {
      if (skipReason) return t.skip(skipReason);
      const client = await loginAs("admin", adminCredentials());
      assertSubjectList(await client.get("/api/subjects"));
    });
  });

  describe("teacher", () => {
    let skipReason = null;
    before(() => {
      skipReason = offline || requireEnv("TEST_TEACHER_EMAIL", "TEST_TEACHER_PASSWORD");
    });

    it("lists assigned subjects via /api/subjects", async (t) => {
      if (skipReason) return t.skip(skipReason);
      const client = await loginAs("teacher", teacherCredentials());
      assertSubjectList(await client.get("/api/subjects"));
    });
  });
});
