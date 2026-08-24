import assert from "node:assert/strict";
import { describe, it, before, after, afterEach } from "node:test";

const HASH = "a".repeat(64);
const DENYLIST_KEY = `revoked:${HASH}`;
const CACHE_KEY = `revoked_cache:${HASH}`;

describe("token revocation keys", () => {
  let redis = null;
  let closeAuthRedis = null;
  let closeAnalyticsRedis = null;
  let authIsTokenRevoked = null;
  let serviceIsTokenRevoked = null;
  let skipReason = null;

  before(async () => {
    if (!process.env.REDIS_URL) {
      skipReason = "REDIS_URL is not set";
      return;
    }

    try {
      const authRedis = await import("../../services/auth/src/config/redis.js");
      const analyticsRedis = await import("../../services/analytics/src/config/redis.js");
      authIsTokenRevoked = (await import("../../services/auth/src/services/revokedTokens.service.js"))
        .isTokenRevoked;
      serviceIsTokenRevoked = (
        await import("../../services/analytics/src/services/revokedTokens.service.js")
      ).isTokenRevoked;
      closeAuthRedis = authRedis.closeRedis;
      closeAnalyticsRedis = analyticsRedis.closeRedis;

      redis = analyticsRedis.createConnection();
      await redis.connect();
      await redis.ping();
    } catch (error) {
      skipReason = `no redis at ${process.env.REDIS_URL}: ${error.message}`;
    }
  });

  after(async () => {
    if (redis) await redis.quit().catch(() => redis.disconnect());
    if (closeAuthRedis) await closeAuthRedis();
    if (closeAnalyticsRedis) await closeAnalyticsRedis();
  });

  afterEach(async () => {
    if (redis) await redis.del(DENYLIST_KEY, CACHE_KEY);
  });

  it("does not treat auth's cached 'not revoked' as a revocation", async (t) => {
    if (skipReason) return t.skip(skipReason);

    await redis.set(CACHE_KEY, "false", "PX", 5000);

    assert.equal(await serviceIsTokenRevoked(HASH), false);
  });

  it("treats a denylist entry as a revocation", async (t) => {
    if (skipReason) return t.skip(skipReason);

    await redis.set(DENYLIST_KEY, "1", "EX", 60);

    assert.equal(await serviceIsTokenRevoked(HASH), true);
  });

  // A cache hit means no database round trip, so this passes only while auth reads its own
  // prefix. Point it back at `revoked:` and the call falls through to Postgres and fails.
  it("reads auth's cache from its own prefix", async (t) => {
    if (skipReason) return t.skip(skipReason);

    await redis.set(CACHE_KEY, "true", "PX", 5000);
    assert.equal(await authIsTokenRevoked(HASH), true);

    await redis.set(CACHE_KEY, "false", "PX", 5000);
    assert.equal(await authIsTokenRevoked(HASH), false);
  });
});
