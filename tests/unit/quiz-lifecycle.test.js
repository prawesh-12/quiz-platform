import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isValidStatusTransition,
  transitionQuizStatus
} from "../../services/quiz/src/services/quizLifecycle.service.js";

// Query order matters: the first SELECT returns the row, the second the updated one.
function fakeDb(row, updatedRow = { id: 1, status: "active", access_token: "tok" }) {
  const updates = [];
  let selects = 0;

  return {
    updates,
    query(sql, params) {
      if (/^\s*UPDATE quizzes/.test(sql)) {
        updates.push({ status: params[0], accessToken: params[1], quizId: params[2] });
        return Promise.resolve({ rows: [] });
      }

      selects += 1;
      if (selects === 1) {
        return Promise.resolve({ rows: row ? [row] : [] });
      }
      return Promise.resolve({ rows: [updatedRow] });
    }
  };
}

const quizRow = (overrides = {}) => ({
  id: 1,
  status: "draft",
  access_token: "existing-token",
  access_code: "ABC123",
  scheduled_start: null,
  starts_in_future: false,
  ...overrides
});

describe("isValidStatusTransition", () => {
  it("allows the three moves the quiz can actually make", () => {
    assert.equal(isValidStatusTransition("draft", "active"), true);
    assert.equal(isValidStatusTransition("scheduled", "active"), true);
    assert.equal(isValidStatusTransition("active", "ended"), true);
  });

  it("blocks everything else", () => {
    assert.equal(isValidStatusTransition("draft", "ended"), false);
    assert.equal(isValidStatusTransition("ended", "active"), false);
    assert.equal(isValidStatusTransition("active", "active"), false);
    assert.equal(isValidStatusTransition("active", "draft"), false);
    assert.equal(isValidStatusTransition("ended", "ended"), false);
  });
});

describe("transitionQuizStatus", () => {
  it("returns null when the quiz does not exist", async () => {
    const result = await transitionQuizStatus(fakeDb(null), { quizId: 404, nextStatus: "active" });

    assert.equal(result, null);
  });

  it("refuses a move that is not allowed", async () => {
    const db = fakeDb(quizRow({ status: "ended" }));
    const result = await transitionQuizStatus(db, { quizId: 1, nextStatus: "active" });

    assert.equal(result.error, "Invalid status transition from ended to active");
    assert.equal(db.updates.length, 0);
  });

  it("allows any move when the check is turned off", async () => {
    const db = fakeDb(quizRow({ status: "ended" }));
    const result = await transitionQuizStatus(db, {
      quizId: 1,
      nextStatus: "active",
      enforceTransition: false
    });

    assert.equal(result.error, undefined);
    assert.equal(db.updates.length, 1);
  });

  it("stores 'scheduled' when activation is asked for but the start is in the future", async () => {
    const db = fakeDb(quizRow({ starts_in_future: true }));
    await transitionQuizStatus(db, { quizId: 1, nextStatus: "active" });

    assert.equal(db.updates[0].status, "scheduled");
  });

  it("stores 'active' when the start has already passed", async () => {
    const db = fakeDb(quizRow({ starts_in_future: false }));
    await transitionQuizStatus(db, { quizId: 1, nextStatus: "active" });

    assert.equal(db.updates[0].status, "active");
  });

  it("flags an ended quiz so the exam service can mark the papers", async () => {
    const db = fakeDb(quizRow({ status: "active" }), { id: 1, status: "ended", access_token: "tok" });
    const result = await transitionQuizStatus(db, { quizId: 1, nextStatus: "ended" });

    assert.equal(result.requires_finalization, true);
    assert.equal(result.quiz.status, "ended");
  });

  it("does not flag anything when the quiz is only being activated", async () => {
    const result = await transitionQuizStatus(fakeDb(quizRow()), { quizId: 1, nextStatus: "active" });

    assert.equal(result.requires_finalization, false);
  });

  it("makes a share token when the quiz does not have one yet", async () => {
    const db = fakeDb(quizRow({ access_token: null }));
    await transitionQuizStatus(db, { quizId: 1, nextStatus: "active" });

    assert.match(db.updates[0].accessToken, /^[0-9a-f]{16}$/);
  });

  it("keeps the token the quiz already has", async () => {
    const db = fakeDb(quizRow({ access_token: "existing-token" }));
    await transitionQuizStatus(db, { quizId: 1, nextStatus: "active" });

    assert.equal(db.updates[0].accessToken, "existing-token");
  });

  it("refuses to activate a quiz with no access code and no token", async () => {
    const db = fakeDb(quizRow({ access_token: null, access_code: null }));
    const result = await transitionQuizStatus(db, { quizId: 1, nextStatus: "active" });

    assert.equal(result.error, "Access code is required before activating quiz");
    assert.equal(db.updates.length, 0);
  });
});
