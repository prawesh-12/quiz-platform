import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planActivationWindow } from "../../services/quiz/src/services/quizTiming.service.js";

// Times without a timezone are India wall-clock, in and out: noon IST is 06:30 UTC.
const IST_NOON = "2025-06-01T12:00:00";
const UTC_FOR_IST_NOON = "2025-06-01T06:30:00Z";

describe("planActivationWindow", () => {
  it("schedules a quiz whose start is still ahead", () => {
    const plan = planActivationWindow({
      requestedStart: "2025-06-01T14:00:00",
      requestedEnd: "2025-06-01T14:30:00",
      durationMins: 30,
      nowInput: IST_NOON
    });

    assert.equal(plan.status, "scheduled");
    assert.equal(plan.scheduledStart, "2025-06-01T14:00:00");
    assert.equal(plan.scheduledEnd, "2025-06-01T14:30:00");
  });

  it("activates a quiz whose start has passed", () => {
    const plan = planActivationWindow({
      requestedStart: "2025-06-01T11:00:00",
      requestedEnd: "2025-06-01T13:00:00",
      durationMins: 120,
      nowInput: IST_NOON
    });

    assert.equal(plan.status, "active");
  });

  it("starts now when no start time is given", () => {
    const plan = planActivationWindow({ durationMins: 30, nowInput: IST_NOON });

    assert.equal(plan.status, "active");
    assert.equal(plan.scheduledStart, "2025-06-01T12:00:00");
    assert.equal(plan.scheduledEnd, "2025-06-01T12:30:00");
  });

  it("derives the end from the duration when no end is given", () => {
    const plan = planActivationWindow({
      requestedStart: "2025-06-01T14:00:00",
      durationMins: 45,
      nowInput: IST_NOON
    });

    assert.equal(plan.scheduledEnd, "2025-06-01T14:45:00");
  });

  it("falls back to 15 minutes when the duration is missing or nonsense", () => {
    for (const durationMins of [undefined, 0, -5, "abc"]) {
      const plan = planActivationWindow({
        requestedStart: "2025-06-01T14:00:00",
        durationMins,
        nowInput: IST_NOON
      });

      assert.equal(plan.scheduledEnd, "2025-06-01T14:15:00", `duration ${durationMins}`);
    }
  });

  it("refuses an end that is not after the start", () => {
    const sameTime = planActivationWindow({
      requestedStart: "2025-06-01T14:00:00",
      requestedEnd: "2025-06-01T14:00:00",
      nowInput: IST_NOON
    });
    assert.equal(sameTime.error, "Scheduled end must be later than scheduled start");

    const backwards = planActivationWindow({
      requestedStart: "2025-06-01T14:00:00",
      requestedEnd: "2025-06-01T13:00:00",
      nowInput: IST_NOON
    });
    assert.equal(backwards.error, "Scheduled end must be later than scheduled start");
    assert.equal(backwards.status, undefined);
  });

  it("converts a UTC timestamp into India wall-clock", () => {
    const plan = planActivationWindow({
      requestedStart: "2025-06-01T09:00:00Z",
      durationMins: 30,
      nowInput: UTC_FOR_IST_NOON
    });

    assert.equal(plan.scheduledStart, "2025-06-01T14:30:00");
    assert.equal(plan.status, "scheduled");
  });

  it("reads a space between the date and the time", () => {
    const plan = planActivationWindow({
      requestedStart: "2025-06-01 14:00",
      durationMins: 30,
      nowInput: IST_NOON
    });

    assert.equal(plan.scheduledStart, "2025-06-01T14:00:00");
  });

  it("accepts Date objects as well as strings", () => {
    const plan = planActivationWindow({
      requestedStart: new Date("2025-06-01T09:00:00Z"),
      durationMins: 30,
      nowInput: new Date("2025-06-01T06:30:00Z")
    });

    assert.equal(plan.status, "scheduled");
    assert.equal(plan.scheduledStart, "2025-06-01T14:30:00");
  });
});
