import assert from "node:assert/strict";
import test from "node:test";

import {
  planActivationWindow,
  resolveQuizWindow,
} from "../services/quizTiming.service.js";

test("future scheduled quiz does not start response timer early", () => {
  const now = new Date("2026-02-18T10:00:00.000Z");
  const plan = planActivationWindow({
    requestedStart: "2026-02-18T10:15:00.000Z",
    durationMins: 20,
    nowInput: now,
  });

  assert.equal(plan.status, "scheduled");

  const window = resolveQuizWindow(
    {
      status: plan.status,
      scheduled_start: plan.scheduledStart,
      scheduled_end: plan.scheduledEnd,
      duration_mins: 20,
    },
    now,
  );

  assert.equal(window.phase, "scheduled");
  assert.equal(window.secondsUntilStart, 900);
  assert.equal(window.responseTimerSeconds, 1200);
});

test("immediate start quiz uses server start/end window", () => {
  const now = new Date("2026-02-18T10:00:00.000Z");
  const plan = planActivationWindow({
    requestedStart: "2026-02-18T09:59:50.000Z",
    durationMins: 20,
    nowInput: now,
  });

  assert.equal(plan.status, "active");

  const window = resolveQuizWindow(
    {
      status: plan.status,
      scheduled_start: plan.scheduledStart,
      scheduled_end: plan.scheduledEnd,
      duration_mins: 20,
    },
    now,
  );

  assert.equal(window.phase, "active");
  assert.equal(window.secondsUntilStart, 0);
  assert.equal(window.secondsUntilEnd, 1190);
});

test("late student join receives only remaining time", () => {
  const lateJoin = new Date("2026-02-18T10:12:00.000Z");
  const window = resolveQuizWindow(
    {
      status: "active",
      scheduled_start: "2026-02-18T10:00:00.000Z",
      scheduled_end: "2026-02-18T10:20:00.000Z",
      duration_mins: 20,
    },
    lateJoin,
  );

  assert.equal(window.phase, "active");
  assert.equal(window.responseTimerSeconds, 480);
});

test("quiz auto-submit boundary is enforced exactly at end_time", () => {
  const atEnd = new Date("2026-02-18T10:20:00.000Z");
  const window = resolveQuizWindow(
    {
      status: "active",
      scheduled_start: "2026-02-18T10:00:00.000Z",
      scheduled_end: "2026-02-18T10:20:00.000Z",
      duration_mins: 20,
    },
    atEnd,
  );

  assert.equal(window.phase, "ended");
  assert.equal(window.secondsUntilEnd, 0);
  assert.equal(window.responseTimerSeconds, 1200);
});

test("refresh during quiz recomputes remaining time from server clock", () => {
  const quiz = {
    status: "active",
    scheduled_start: "2026-02-18T10:00:00.000Z",
    scheduled_end: "2026-02-18T10:20:00.000Z",
    duration_mins: 20,
  };

  const firstLoad = resolveQuizWindow(quiz, new Date("2026-02-18T10:05:00.000Z"));
  const refreshLoad = resolveQuizWindow(quiz, new Date("2026-02-18T10:11:00.000Z"));

  assert.equal(firstLoad.phase, "active");
  assert.equal(firstLoad.responseTimerSeconds, 900);
  assert.equal(refreshLoad.phase, "active");
  assert.equal(refreshLoad.responseTimerSeconds, 540);
});

test("datetime-local input is interpreted in India time", () => {
  const now = new Date("2026-02-18T13:00:00.000Z"); // 18:30 IST
  const plan = planActivationWindow({
    requestedStart: "2026-02-18T19:00",
    durationMins: 30,
    nowInput: now,
  });

  assert.equal(plan.status, "scheduled");
  assert.equal(plan.scheduledStart, "2026-02-18T19:00:00");
  assert.equal(plan.scheduledEnd, "2026-02-18T19:30:00");
});
