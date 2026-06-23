import { test } from "node:test";
import assert from "node:assert/strict";

// REDIS_URL is unset in tests, so cache.service falls back to the process-local tier.
// This verifies the fallback path behaves like a correct short-TTL cache.
import { getCachedJson, invalidateCache } from "../services/cache.service.js";

test("getCachedJson (no Redis) caches within the TTL and dedupes", async () => {
  let calls = 0;
  const factory = async () => {
    calls += 1;
    return { n: calls };
  };

  const a = await getCachedJson("test:key", 1000, factory);
  const b = await getCachedJson("test:key", 1000, factory);

  assert.deepEqual(a, { n: 1 });
  assert.deepEqual(b, { n: 1 });
  assert.equal(calls, 1);

  await invalidateCache("test:key");
  const c = await getCachedJson("test:key", 1000, factory);
  assert.deepEqual(c, { n: 2 }, "invalidate should force a recompute");
});

test("getCachedJson (no Redis) does not cache a rejected factory", async () => {
  let calls = 0;
  const factory = async () => {
    calls += 1;
    throw new Error("boom");
  };

  await assert.rejects(() => getCachedJson("test:err", 1000, factory));
  await assert.rejects(() => getCachedJson("test:err", 1000, factory));
  assert.equal(calls, 2);
});
