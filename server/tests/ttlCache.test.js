import { test } from "node:test";
import assert from "node:assert/strict";

import createTtlCache from "../utils/ttlCache.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("getOrSet runs the factory once within the TTL window", async () => {
  const cache = createTtlCache();
  let calls = 0;
  const factory = async () => {
    calls += 1;
    return calls;
  };

  const a = await cache.getOrSet("k", 1000, factory);
  const b = await cache.getOrSet("k", 1000, factory);

  assert.equal(a, 1);
  assert.equal(b, 1);
  assert.equal(calls, 1, "second call should be served from cache");
});

test("getOrSet dedupes concurrent callers into one factory run", async () => {
  const cache = createTtlCache();
  let calls = 0;
  const factory = async () => {
    calls += 1;
    await wait(20);
    return "v";
  };

  const [a, b, c] = await Promise.all([
    cache.getOrSet("k", 1000, factory),
    cache.getOrSet("k", 1000, factory),
    cache.getOrSet("k", 1000, factory)
  ]);

  assert.deepEqual([a, b, c], ["v", "v", "v"]);
  assert.equal(calls, 1, "concurrent cold callers should share one in-flight promise");
});

test("entries expire after the TTL", async () => {
  const cache = createTtlCache();
  let calls = 0;
  const factory = async () => {
    calls += 1;
    return calls;
  };

  await cache.getOrSet("k", 10, factory);
  await wait(25);
  const after = await cache.getOrSet("k", 10, factory);

  assert.equal(after, 2);
  assert.equal(calls, 2, "expired key should re-run the factory");
});

test("a rejected factory is not cached", async () => {
  const cache = createTtlCache();
  let calls = 0;
  const factory = async () => {
    calls += 1;
    throw new Error("boom");
  };

  await assert.rejects(() => cache.getOrSet("k", 1000, factory));
  await assert.rejects(() => cache.getOrSet("k", 1000, factory));
  assert.equal(calls, 2, "failed factory result must not be cached");
});

test("get returns undefined for a key that was never set", () => {
  const cache = createTtlCache();
  assert.equal(cache.get("missing"), undefined);
});

test("evicts the oldest entry once maxEntries is exceeded", async () => {
  const cache = createTtlCache({ maxEntries: 2 });

  await cache.getOrSet("k1", 1000, async () => 1);
  await cache.getOrSet("k2", 1000, async () => 2);
  await cache.getOrSet("k3", 1000, async () => 3); // pushes size past the cap

  assert.equal(cache.get("k1"), undefined, "oldest entry should be evicted");
  assert.equal(cache.get("k2"), 2);
  assert.equal(cache.get("k3"), 3);
});

test("invalidate and invalidatePrefix drop entries", async () => {
  const cache = createTtlCache();
  await cache.getOrSet("summary:1", 1000, async () => "a");
  await cache.getOrSet("summary:2", 1000, async () => "b");
  await cache.getOrSet("other", 1000, async () => "c");

  cache.invalidatePrefix("summary:");

  assert.equal(cache.get("summary:1"), undefined);
  assert.equal(cache.get("summary:2"), undefined);
  assert.equal(cache.get("other"), "c");

  cache.invalidate("other");
  assert.equal(cache.get("other"), undefined);
});
