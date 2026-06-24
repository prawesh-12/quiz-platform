import { describe, it } from "node:test";

// Acceptance test for the event-consumer reliability behavior. The consumer now acks only
// on success, leaves failed entries pending, reclaims them via XAUTOCLAIM, and dead-letters
// after MAX_ATTEMPTS (services/*/src/config/eventConsumer.js). These specs are still skipped
// because they need a live Redis plus a harness that injects a failing handler — implement
// that harness, then remove `.skip`.
//
// Suggested setup: XADD a known event, start the consumer with a handler forced to throw
// once, then assert the entry stays in XPENDING, gets retried, and is acked only after the
// retry succeeds; force permanent failure and assert it lands on events:deadletter.
describe("redis consumer retry behavior", () => {
  it.skip("retries a failed handler instead of acking the dropped event", () => {});
  it.skip("dead-letters an event after maxAttempts", () => {});
});
