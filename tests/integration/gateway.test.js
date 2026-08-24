import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

import { createClient, gatewayUnreachable } from "../helpers/client.js";

// Needs a running stack but no credentials, unlike the other integration suites.
const SERVICES = ["auth", "questionbank", "quiz", "analytics", "exam"];

const PROTECTED_PATHS = [
  "/api/subjects",
  "/api/units/1",
  "/api/questions/1",
  "/api/quizzes",
  "/api/admin/subjects",
  "/api/admin/teachers",
  "/api/admin/schools",
  "/api/admin/dashboard",
  "/api/teachers/dashboard"
];

describe("gateway", () => {
  const client = createClient();
  let skipReason = null;

  before(async () => {
    skipReason = await gatewayUnreachable();
  });

  it("answers /api/health", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const res = await client.get("/api/health");

    assert.equal(res.status, 200);
  });

  for (const service of SERVICES) {
    it(`routes /api/${service}/ready to the ${service} service`, async (t) => {
      if (skipReason) return t.skip(skipReason);
      const res = await client.get(`/api/${service}/ready`);

      assert.equal(res.status, 200, `${service} is not ready, so it cannot reach its database`);
    });
  }

  for (const path of PROTECTED_PATHS) {
    it(`refuses ${path} without a session`, async (t) => {
      if (skipReason) return t.skip(skipReason);
      const res = await client.get(path);

      assert.equal(res.status, 401, `${path} answered ${res.status} to an anonymous request`);
    });
  }

  it("does not serve the website", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const res = await client.get("/");

    assert.equal(res.status, 404);
  });

  it("404s an api path nothing owns", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const res = await client.get("/api/nothing-here");

    assert.equal(res.status, 404);
  });

  it("does not expose the internal question endpoint", async (t) => {
    if (skipReason) return t.skip(skipReason);

    // Forging the header must not help: the gateway has no route to /internal at all.
    const res = await fetch(`${client.baseUrl}/internal/questions/select`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-key": "forged" },
      body: JSON.stringify({ unitIds: [1], count: 1 })
    });

    assert.equal(res.status, 404);
  });
});
