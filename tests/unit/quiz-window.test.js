import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveQuizWindow } from "../../services/exam/src/services/quizTiming.service.js";

const NOON = "2025-06-01T12:00:00";

const quiz = (overrides = {}) => ({
  status: "active",
  scheduled_start: "2025-06-01T11:00:00",
  scheduled_end: "2025-06-01T13:00:00",
  duration_mins: 120,
  ...overrides
});

describe("resolveQuizWindow", () => {
  it("reports a quiz that has not opened yet as scheduled", () => {
    const window = resolveQuizWindow(
      quiz({ status: "scheduled", scheduled_start: "2025-06-01T14:00:00", scheduled_end: "2025-06-01T15:00:00" }),
      NOON
    );

    assert.equal(window.phase, "scheduled");
    assert.equal(window.hasStarted, false);
    assert.equal(window.hasEnded, false);
    assert.equal(window.secondsUntilStart, 2 * 60 * 60);
  });

  it("reports a quiz inside its window as active", () => {
    const window = resolveQuizWindow(quiz(), NOON);

    assert.equal(window.phase, "active");
    assert.equal(window.hasStarted, true);
    assert.equal(window.hasEnded, false);
    assert.equal(window.secondsUntilEnd, 60 * 60);
    assert.equal(window.totalDurationSeconds, 2 * 60 * 60);
  });

  it("reports a quiz past its end time as ended, whatever its status says", () => {
    const window = resolveQuizWindow(
      quiz({ scheduled_start: "2025-06-01T08:00:00", scheduled_end: "2025-06-01T09:00:00" }),
      NOON
    );

    assert.equal(window.phase, "ended");
    assert.equal(window.hasEnded, true);
    assert.equal(window.secondsUntilEnd, 0);
  });

  it("trusts an ended status even inside the window", () => {
    const window = resolveQuizWindow(quiz({ status: "ended" }), NOON);

    assert.equal(window.phase, "ended");
  });

  it("gives the student the time left while active, and the full length otherwise", () => {
    const active = resolveQuizWindow(quiz(), NOON);
    assert.equal(active.responseTimerSeconds, active.secondsUntilEnd);

    const notYet = resolveQuizWindow(
      quiz({ status: "scheduled", scheduled_start: "2025-06-01T14:00:00", scheduled_end: "2025-06-01T15:00:00" }),
      NOON
    );
    assert.equal(notYet.responseTimerSeconds, notYet.totalDurationSeconds);
  });

  it("works out the end from the duration when no end time is stored", () => {
    const window = resolveQuizWindow(
      quiz({ scheduled_end: null, duration_mins: 30 }),
      NOON
    );

    assert.equal(window.totalDurationSeconds, 30 * 60);
    assert.equal(window.endAt.getTime(), window.startAt.getTime() + 30 * 60 * 1000);
  });

  it("falls back to the created time when there is no start time", () => {
    const window = resolveQuizWindow(
      { status: "active", created_at: "2025-06-01T11:30:00", duration_mins: 60 },
      NOON
    );

    assert.equal(window.phase, "active");
    assert.equal(window.secondsUntilEnd, 30 * 60);
  });

  it("falls back to a 15 minute quiz when the duration is missing", () => {
    const window = resolveQuizWindow(
      { status: "active", scheduled_start: "2025-06-01T12:00:00" },
      NOON
    );

    assert.equal(window.totalDurationSeconds, 15 * 60);
  });

  it("never returns a negative countdown", () => {
    const window = resolveQuizWindow(
      quiz({ scheduled_start: "2025-06-01T06:00:00", scheduled_end: "2025-06-01T07:00:00" }),
      NOON
    );

    assert.equal(window.secondsUntilStart, 0);
    assert.equal(window.secondsUntilEnd, 0);
  });
});
