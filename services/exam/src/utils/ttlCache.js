// Process-local TTL cache with a size cap. Dependency-free; per-process, so keep TTLs
// short (seconds) to bound staleness across instances.

const DEFAULT_MAX_ENTRIES = 500;

export function createTtlCache({ maxEntries = DEFAULT_MAX_ENTRIES } = {}) {
  const store = new Map(); // key -> { value, expiresAt }

  function evictIfNeeded() {
    if (store.size <= maxEntries) {
      return;
    }
    // Map preserves insertion order; drop the oldest entry.
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) {
      store.delete(oldestKey);
    }
  }

  function get(key) {
    const entry = store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key, value, ttlMs) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    evictIfNeeded();
  }

  // Cache factory() for ttlMs. Concurrent callers reuse the in-flight promise (one run).
  async function getOrSet(key, ttlMs, factory) {
    const cached = get(key);
    if (cached !== undefined) {
      return cached;
    }
    const promise = Promise.resolve().then(factory);
    set(key, promise, ttlMs);
    try {
      const value = await promise;
      set(key, value, ttlMs);
      return value;
    } catch (error) {
      store.delete(key);
      throw error;
    }
  }

  function invalidate(key) {
    store.delete(key);
  }

  function invalidatePrefix(prefix) {
    for (const key of store.keys()) {
      if (typeof key === "string" && key.startsWith(prefix)) {
        store.delete(key);
      }
    }
  }

  function clear() {
    store.clear();
  }

  return { get, set, getOrSet, invalidate, invalidatePrefix, clear };
}

export default createTtlCache;
