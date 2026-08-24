import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeNullableText } from "../../services/exam/src/utils/text.js";
import { generateAccessToken } from "../../services/quiz/src/utils/accessToken.js";

describe("normalizeNullableText", () => {
  it("trims the value", () => {
    assert.equal(normalizeNullableText("  Roll 42  "), "Roll 42");
  });

  it("turns blank input into null", () => {
    assert.equal(normalizeNullableText(""), null);
    assert.equal(normalizeNullableText("   "), null);
    assert.equal(normalizeNullableText(null), null);
    assert.equal(normalizeNullableText(undefined), null);
  });

  it("keeps a zero rather than treating it as blank", () => {
    assert.equal(normalizeNullableText(0), "0");
  });
});

describe("generateAccessToken", () => {
  it("makes a 16 character hex token", () => {
    assert.match(generateAccessToken(), /^[0-9a-f]{16}$/);
  });

  it("makes a different token every time", () => {
    const tokens = new Set(Array.from({ length: 50 }, generateAccessToken));

    assert.equal(tokens.size, 50);
  });
});
