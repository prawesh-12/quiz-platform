import { lazy, useEffect, useSyncExternalStore } from "react";

const IDLE_PREFETCH_TIMEOUT_MS = 2000;

const pendingListeners = new Set();
const routeEntries = [];
let pendingChunkCount = 0;

// Deferred because chunk loading starts during render and listeners call setState.
function notifyPending() {
  queueMicrotask(() => pendingListeners.forEach((listener) => listener()));
}

function subscribePending(listener) {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
}

function getPendingSnapshot() {
  return pendingChunkCount > 0;
}

function getServerPendingSnapshot() {
  return false;
}

function trackPending(promise) {
  pendingChunkCount += 1;
  notifyPending();

  const settle = () => {
    pendingChunkCount -= 1;
    notifyPending();
  };

  promise.then(settle, settle);
}

export function useChunkPending() {
  return useSyncExternalStore(subscribePending, getPendingSnapshot, getServerPendingSnapshot);
}

// Route component that can be fetched ahead of the click, so navigation never suspends.
export function lazyWithPreload(factory) {
  let loadPromise = null;

  function load(options) {
    if (!loadPromise) {
      loadPromise = factory().catch((error) => {
        loadPromise = null;
        throw error;
      });
    }

    if (!options?.isSilent) {
      trackPending(loadPromise);
    }

    return loadPromise;
  }

  const RouteComponent = lazy(load);
  RouteComponent.preload = load;
  return RouteComponent;
}

export function registerRoutePreloads(entries) {
  routeEntries.splice(0, routeEntries.length, ...entries);
}

function toStaticPrefix(path) {
  const paramIndex = path.indexOf("/:");
  if (paramIndex === -1) {
    return path;
  }
  return path.slice(0, paramIndex);
}

function findRouteEntry(pathname) {
  let bestEntry = null;
  let bestLength = -1;

  routeEntries.forEach((entry) => {
    const prefix = toStaticPrefix(entry.path);
    if (pathname.startsWith(prefix) && prefix.length > bestLength) {
      bestEntry = entry;
      bestLength = prefix.length;
    }
  });

  return bestEntry;
}

// Call from a link's onMouseEnter/onFocus so the chunk is already resolved by click time.
export function prefetchRoute(pathname) {
  const entry = findRouteEntry(pathname);
  if (entry) {
    entry.preload({ isSilent: true });
  }
}

function prefetchAllRoutes() {
  routeEntries.forEach((entry) => entry.preload({ isSilent: true }));
}

export function usePrefetchOnIdle() {
  useEffect(() => {
    if (typeof window.requestIdleCallback !== "function") {
      const timeoutId = window.setTimeout(prefetchAllRoutes, IDLE_PREFETCH_TIMEOUT_MS);
      return () => window.clearTimeout(timeoutId);
    }

    const handle = window.requestIdleCallback(prefetchAllRoutes, {
      timeout: IDLE_PREFETCH_TIMEOUT_MS
    });
    return () => window.cancelIdleCallback(handle);
  }, []);
}
