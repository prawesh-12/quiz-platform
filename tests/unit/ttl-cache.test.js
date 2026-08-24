import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createTtlCache } from "../../services/exam/src/utils/ttlCache.js";

describe("createTtlCache", () => {
  it("gives back what was put in", () => {
    const cache = createTtlCache();
    cache.set("a", 1, 1000);

    assert.equal(cache.get("a"), 1);
    assert.equal(cache.get("missing"), undefined);
  });

  it("forgets an entry once its time is up", () => {
    const cache = createTtlCache();
    cache.set("a", 1, -1);

    assert.equal(cache.get("a"), undefined);
  });

  it("drops the oldest entry when it is full", () => {
    const cache = createTtlCache({ maxEntries: 2 });
    cache.set("a", 1, 1000);
    cache.set("b", 2, 1000);
    cache.set("c", 3, 1000);

    assert.equal(cache.get("a"), undefined);
    assert.equal(cache.get("b"), 2);
    assert.equal(cache.get("c"), 3);
  });

  it("runs the factory once when several callers ask at the same time", async () => {
    const cache = createTtlCache();
    let runs = 0;
    const slow = async () => {
      runs += 1;
      return "value";
    };

    const results = await Promise.all([
      cache.getOrSet("k", 1000, slow),
      cache.getOrSet("k", 1000, slow),
      cache.getOrSet("k", 1000, slow)
    ]);

    assert.deepEqual(results, ["value", "value", "value"]);
    assert.equal(runs, 1);
  });

  it("does not cache a failure", async () => {
    const cache = createTtlCache();

    await assert.rejects(
      cache.getOrSet("k", 1000, async () => {
        throw new Error("nope");
      })
    );
    assert.equal(cache.get("k"), undefined);

    const second = await cache.getOrSet("k", 1000, async () => "worked");
    assert.equal(second, "worked");
  });

  it("removes one key, or every key with a prefix", () => {
    const cache = createTtlCache();
    cache.set("quiz:1:stats", "a", 1000);
    cache.set("quiz:1:list", "b", 1000);
    cache.set("quiz:2:stats", "c", 1000);

    cache.invalidate("quiz:2:stats");
    assert.equal(cache.get("quiz:2:stats"), undefined);

    cache.invalidatePrefix("quiz:1:");
    assert.equal(cache.get("quiz:1:stats"), undefined);
    assert.equal(cache.get("quiz:1:list"), undefined);
  });

  it("empties completely on clear", () => {
    const cache = createTtlCache();
    cache.set("a", 1, 1000);
    cache.clear();

    assert.equal(cache.get("a"), undefined);
  });
});
