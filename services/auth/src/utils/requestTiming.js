import { AsyncLocalStorage } from "node:async_hooks";

const als = new AsyncLocalStorage();

// Bind the timing store to the current request's async context; persists across later awaits.
export function enterContext(store) {
  als.enterWith(store);
}

export function getContext() {
  return als.getStore();
}

// Time an async op and add its duration to the active request's `<bucket>Ms` field (no-op
// outside a request).
export async function measure(bucket, run) {
  const store = als.getStore();
  if (!store) {
    return run();
  }

  const start = process.hrtime.bigint();
  try {
    return await run();
  } finally {
    store[`${bucket}Ms`] += Number(process.hrtime.bigint() - start) / 1e6;
  }
}
