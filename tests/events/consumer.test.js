import assert from "node:assert/strict";
import { describe, it, before, after, beforeEach, afterEach } from "node:test";

// Set before importing the consumer: it reads these once, at import.
process.env.CONSUMER_BLOCK_MS = "100";
process.env.CONSUMER_RECLAIM_IDLE_MS = "150";
process.env.CONSUMER_RECLAIM_INTERVAL_MS = "50";
process.env.CONSUMER_MAX_ATTEMPTS = "2";
process.env.CONSUMER_DEADLETTER_STREAM = "test:deadletter";

const MAX_ATTEMPTS = 2;
const DEADLETTER = "test:deadletter";
const WAIT_TIMEOUT_MS = 15000;

async function waitFor(condition, what) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail(`timed out waiting for ${what}`);
}

describe("redis stream consumer", () => {
  let redis = null;
  let closeRedis = null;
  let startStreamConsumer = null;
  let skipReason = null;
  let running = [];
  let streams = [];
  let counter = 0;

  before(async () => {
    if (!process.env.REDIS_URL) {
      skipReason = "REDIS_URL is not set";
      return;
    }

    try {
      const redisConfig = await import("../../services/exam/src/config/redis.js");
      const consumer = await import("../../services/exam/src/config/eventConsumer.js");
      startStreamConsumer = consumer.startStreamConsumer;
      closeRedis = redisConfig.closeRedis;
      redis = redisConfig.createConnection();
      await redis.connect();
      await redis.ping();
    } catch (error) {
      // Drop the client and stop it retrying, or the test process never exits.
      redis?.disconnect();
      redis = null;
      skipReason = `no redis at ${process.env.REDIS_URL}: ${error.message}`;
    }
  });

  after(async () => {
    if (redis) await redis.quit().catch(() => redis.disconnect());
    if (closeRedis) await closeRedis();
  });

  beforeEach(() => {
    counter += 1;
  });

  afterEach(async () => {
    await Promise.all(running.map((consumer) => consumer.stop()));
    running = [];
    if (redis && streams.length > 0) {
      await redis.del(...streams, DEADLETTER);
      streams = [];
    }
  });

  // One stream and group per test so a leftover entry cannot leak into the next one.
  function names() {
    const stream = `test:events:${counter}`;
    streams.push(stream);
    return { stream, group: `group-${counter}`, consumer: `consumer-${counter}` };
  }

  function start(target, handler) {
    const consumer = startStreamConsumer({ ...target, handler });
    running.push(consumer);
    return consumer;
  }

  async function pendingCount(stream, group) {
    const pending = await redis.xpending(stream, group);
    return Number(pending?.[0] ?? 0);
  }

  it("delivers an event that was already in the stream before it started", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const target = names();
    const seen = [];

    await redis.xadd(target.stream, "*", "type", "quiz.ended", "payload", JSON.stringify({ quizId: 7 }));
    start(target, (message) => {
      seen.push(message);
    });

    await waitFor(() => seen.length === 1, "the existing event to be delivered");
    assert.equal(seen[0].type, "quiz.ended");
    assert.deepEqual(JSON.parse(seen[0].payload), { quizId: 7 });
  });

  it("acks an event the handler dealt with", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const target = names();
    let handled = 0;

    start(target, () => {
      handled += 1;
    });
    await redis.xadd(target.stream, "*", "type", "quiz.ended", "payload", "{}");

    await waitFor(() => handled === 1, "the event to be handled");
    await waitFor(async () => (await pendingCount(target.stream, target.group)) === 0, "the entry to be acked");
  });

  it("leaves a failed event pending instead of acking it", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const target = names();
    let attempts = 0;

    start(target, () => {
      attempts += 1;
      throw new Error("handler blew up");
    });
    await redis.xadd(target.stream, "*", "type", "quiz.ended", "payload", "{}");

    await waitFor(() => attempts >= 1, "the first delivery");
    assert.equal(await pendingCount(target.stream, target.group), 1);
  });

  it("retries a failed event and acks it once the handler works", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const target = names();
    let attempts = 0;

    start(target, () => {
      attempts += 1;
      if (attempts === 1) throw new Error("fails once");
    });
    await redis.xadd(target.stream, "*", "type", "quiz.ended", "payload", "{}");

    await waitFor(() => attempts >= 2, "the retry");
    await waitFor(
      async () => (await pendingCount(target.stream, target.group)) === 0,
      "the retried entry to be acked"
    );
  });

  it("dead-letters an event that keeps failing, then stops retrying it", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const target = names();
    let attempts = 0;

    start(target, () => {
      attempts += 1;
      throw new Error("always fails");
    });
    const id = await redis.xadd(target.stream, "*", "type", "quiz.ended", "payload", JSON.stringify({ quizId: 9 }));

    await waitFor(async () => (await redis.xlen(DEADLETTER)) === 1, "the event to be dead-lettered");

    const [[, fields]] = await redis.xrange(DEADLETTER, "-", "+");
    const dead = Object.fromEntries(
      fields.reduce((pairs, value, index) => {
        if (index % 2 === 0) pairs.push([value, fields[index + 1]]);
        return pairs;
      }, [])
    );

    assert.equal(dead.type, "quiz.ended");
    assert.deepEqual(JSON.parse(dead.payload), { quizId: 9 });
    assert.equal(dead.originalStream, target.stream);
    assert.equal(dead.originalId, id);
    assert.equal(dead.group, target.group);
    assert.ok(Number(dead.attempts) >= MAX_ATTEMPTS, `attempts was ${dead.attempts}`);

    await waitFor(
      async () => (await pendingCount(target.stream, target.group)) === 0,
      "the dead-lettered entry to be acked"
    );

    const attemptsAtDeadLetter = attempts;
    await new Promise((resolve) => setTimeout(resolve, 400));
    assert.equal(attempts, attemptsAtDeadLetter, "handler ran again after the event was dead-lettered");
  });

  it("gives each consumer group its own copy of an event", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const target = names();
    const first = [];
    const second = [];

    start(target, (message) => first.push(message));
    start({ ...target, group: `${target.group}-b`, consumer: `${target.consumer}-b` }, (message) =>
      second.push(message)
    );
    await redis.xadd(target.stream, "*", "type", "subject.upserted", "payload", "{}");

    await waitFor(() => first.length === 1 && second.length === 1, "both groups to receive the event");
  });
});
