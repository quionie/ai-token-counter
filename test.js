"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { countTokens, countMessages } = require("./index");

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

test("supports Claude family names without the claude prefix", () => {
  const result = countTokens(
    "Plan a release note summary with highlights and follow-up tasks.",
    "sonnet-4"
  );

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

test("counts dense mixed content higher than plain prose", () => {
  const plainText = "Summarize the customer call and extract action items.";
  const denseText = "Summarize call #48291 ASAP!!! Include 3 risks, 2 owners, and status ✅";

  assert.ok(
    countTokens(denseText, "gpt-4o") > countTokens(plainText, "gpt-4o")
  );
});

test("counts chat-style message arrays", () => {
  const messages = [
    {
      role: "system",
      content: "You are a concise release notes assistant."
    },
    {
      role: "user",
      content: "Summarize the latest release and list three breaking changes."
    }
  ];

  const result = countMessages(messages, "gpt-4o");

  assert.equal(typeof result, "number");
  assert.ok(result > countTokens(messages[0].content, "gpt-4o"));
});

test("supports Claude models when counting messages", () => {
  const messages = [
    {
      role: "user",
      content: "Draft a customer-ready incident summary."
    },
    {
      role: "assistant",
      content: "I can help with that."
    }
  ];

  assert.ok(countMessages(messages, "sonnet-4") >= 1);
});

test("returns 0 for an empty messages array", () => {
  assert.equal(countMessages([], "gpt-4o"), 0);
});

test("throws for invalid message collections", () => {
  assert.throws(() => countMessages("not-an-array", "gpt-4o"), /messages must be an array/);
  assert.throws(
    () => countMessages([{ role: "user", content: 42 }], "gpt-4o"),
    /each message content must be a string/
  );
});

test("cli counts direct text input", () => {
  const output = execFileSync(
    process.execPath,
    ["./cli.js", "Summarize this pull request.", "--model", "gpt-4o"],
    {
      cwd: __dirname,
      encoding: "utf8"
    }
  ).trim();

  assert.match(output, /^\d+$/);
});

test("cli counts file input", () => {
  const fixturePath = path.join(__dirname, "tmp-cli-input.txt");

  try {
    fs.writeFileSync(
      fixturePath,
      "Review this release note and extract the top three changes.",
      "utf8"
    );

    const output = execFileSync(
      process.execPath,
      ["./cli.js", "--model", "sonnet-4", "--file", fixturePath],
      {
        cwd: __dirname,
        encoding: "utf8"
      }
    ).trim();

    assert.match(output, /^\d+$/);
  } finally {
    if (fs.existsSync(fixturePath)) {
      fs.unlinkSync(fixturePath);
    }
  }
});
