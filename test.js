"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { countTokens } = require("./index");

test("returns 0 for empty text", () => {
  assert.equal(countTokens("", "gpt-4o"), 0);
});

test("estimates tokens for OpenAI models", () => {
  const result = countTokens("Hello world from OpenAI", "gpt-4o");

  assert.equal(typeof result, "number");
  assert.ok(result >= 1);
});

test("estimates tokens for Claude models", () => {
  const result = countTokens("Hello world from Claude", "claude-3-haiku");

  assert.equal(typeof result, "number");
  assert.ok(result >= 1);
});

test("produces different estimates for different providers", () => {
  const text =
    "A longer sentence with punctuation, numbers 12345, and enough content " +
    "to make the provider-specific heuristics diverge after rounding.";

  assert.ok(
    countTokens(text, "gpt-4.1-mini") > countTokens(text, "claude-3-7-sonnet")
  );
});

test("throws for unsupported model names", () => {
  assert.throws(
    () => countTokens("Hello", "mistral-small"),
    /Unsupported model/
  );
});

test("throws for invalid text input", () => {
  assert.throws(() => countTokens(null, "gpt-4o"), /text must be a string/);
});
