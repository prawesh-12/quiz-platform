import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

import { createClient, adminCredentials, requireEnv } from "../helpers/client.js";

// Covers cookie-based session hydration: login sets the cookie, a fresh /me read
// (simulating a hard refresh) returns the same user, and a cookie-less client is rejected.
describe("auth cookie hydration", () => {
  let skipReason = null;

  before(() => {
    skipReason = requireEnv("TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD");
  });

  it("rejects /api/auth/me without a session cookie", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const client = createClient();
    const res = await client.get("/api/auth/me");
    assert.equal(res.status, 401);
  });

  it("rejects bad credentials and sets no session cookie", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const client = createClient();
    const res = await client.post("/api/auth/login", {
      email: adminCredentials().email,
      password: "definitely-wrong-password",
      role: "admin"
    });
    assert.ok(res.status === 401 || res.status === 400, `expected auth failure, got ${res.status}`);
    assert.equal(client.hasCookie("quiz_session"), false);
  });

  it("logs in, hydrates via /me, then logout invalidates the cookie", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const client = createClient();

    const login = await client.post("/api/auth/login", { ...adminCredentials(), role: "admin" });
    assert.equal(login.status, 200);
    assert.equal(client.hasCookie("quiz_session"), true);

    const me = await client.get("/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.data?.user?.role, "admin");

    const logout = await client.post("/api/auth/logout");
    assert.equal(logout.status, 200);

    // The just-revoked token must fail immediately on the next read.
    const afterLogout = await client.get("/api/auth/me");
    assert.equal(afterLogout.status, 401);
  });
});
