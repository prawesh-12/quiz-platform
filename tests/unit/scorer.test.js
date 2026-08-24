import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scoreSubmission } from "../../services/exam/src/services/scorer.service.js";

const question = (id, correct, points) => ({
  id,
  correct_option: correct,
  ...(points === undefined ? {} : { points })
});

describe("scoreSubmission", () => {
  it("scores one point per correct answer by default", () => {
    const result = scoreSubmission(
      [question(1, "A"), question(2, "B"), question(3, "C")],
      [
        { question_id: 1, selected_option: "A" },
        { question_id: 2, selected_option: "D" },
        { question_id: 3, selected_option: "C" }
      ]
    );

    assert.equal(result.score, 2);
    assert.equal(result.total_points, 3);
    assert.deepEqual(
      result.gradedAnswers.map((a) => a.is_correct),
      [true, false, true]
    );
  });

  it("uses the points on each question", () => {
    const result = scoreSubmission(
      [question(1, "A", 5), question(2, "B", 3)],
      [{ question_id: 1, selected_option: "A" }]
    );

    assert.equal(result.score, 5);
    assert.equal(result.total_points, 8);
  });

  it("counts an unanswered question in the total but not the score", () => {
    const result = scoreSubmission([question(1, "A"), question(2, "B")], [
      { question_id: 1, selected_option: "A" }
    ]);

    assert.equal(result.score, 1);
    assert.equal(result.total_points, 2);
    assert.equal(result.gradedAnswers[1].selected_option, null);
    assert.equal(result.gradedAnswers[1].is_correct, false);
  });

  it("treats a null answer as wrong rather than correct", () => {
    const result = scoreSubmission([question(1, "A")], [
      { question_id: 1, selected_option: null }
    ]);

    assert.equal(result.score, 0);
    assert.equal(result.gradedAnswers[0].is_correct, false);
  });

  it("ignores answers for questions that are not in the quiz", () => {
    const result = scoreSubmission([question(1, "A")], [
      { question_id: 1, selected_option: "A" },
      { question_id: 99, selected_option: "A" }
    ]);

    assert.equal(result.score, 1);
    assert.equal(result.total_points, 1);
    assert.equal(result.gradedAnswers.length, 1);
  });

  it("keeps the last answer when a question is answered twice", () => {
    const result = scoreSubmission([question(1, "A")], [
      { question_id: 1, selected_option: "A" },
      { question_id: 1, selected_option: "B" }
    ]);

    assert.equal(result.score, 0);
    assert.equal(result.gradedAnswers[0].selected_option, "B");
  });

  it("matches question ids that arrive as strings", () => {
    const result = scoreSubmission([question(1, "A")], [
      { question_id: "1", selected_option: "A" }
    ]);

    assert.equal(result.score, 1);
  });

  it("returns zero for a quiz with no questions", () => {
    const result = scoreSubmission([], []);

    assert.deepEqual(result, { gradedAnswers: [], score: 0, total_points: 0 });
  });

  it("scores nothing when the student answered nothing", () => {
    const result = scoreSubmission([question(1, "A"), question(2, "B")], []);

    assert.equal(result.score, 0);
    assert.equal(result.total_points, 2);
  });
});
