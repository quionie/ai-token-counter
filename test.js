"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const {
  countTokens,
  countMessages,
  getModelInfo,
  fitsContextWindow,
  estimateCost
} = require("./index");

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

test("estimates tokens for Gemini models", () => {
  const result = countTokens("Hello world from Gemini", "gemini-2.0-flash");

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

test("supports Claude opus aliases with spaces", () => {
  const result = countTokens(
    "Review this incident summary and provide executive highlights.",
    "opus 4.6"
  );

  assert.equal(typeof result, "number");
  assert.ok(result >= 1);
});

test("returns model metadata for supported models", () => {
  assert.deepEqual(getModelInfo("opus 4.6"), {
    provider: "claude",
    family: "claude",
    normalizedModel: "opus-4-6",
    contextWindow: 200000,
    supportsMessages: true,
    matchedBy: "opus"
  });
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

test("throws for unsupported model info lookups", () => {
  assert.throws(() => getModelInfo("mistral-small"), /Unsupported model/);
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

test("supports Gemini models when counting messages", () => {
  const messages = [
    {
      role: "user",
      content: "Summarize this product feedback into a concise update."
    }
  ];

  assert.ok(countMessages(messages, "gemini-1.5-pro") >= 1);
});

test("fitsContextWindow returns prompt budget details for text", () => {
  const result = fitsContextWindow(
    "Summarize this support thread.",
    "gpt-4o",
    500
  );

  assert.equal(result.provider, "openai");
  assert.equal(result.contextWindow, 128000);
  assert.equal(result.reservedOutputTokens, 500);
  assert.ok(result.inputTokens >= 1);
  assert.equal(result.fits, true);
});

test("fitsContextWindow supports chat-style messages", () => {
  const result = fitsContextWindow(
    [{ role: "user", content: "Summarize this outage report." }],
    "gemini-1.5-pro",
    1000
  );

  assert.equal(result.provider, "gemini");
  assert.equal(result.contextWindow, 1000000);
  assert.equal(result.fits, true);
});

test("fitsContextWindow returns false when reserved output exceeds capacity", () => {
  const result = fitsContextWindow("hello", "sonnet-4", 500000);

  assert.equal(result.availableInputTokens, 0);
  assert.equal(result.fits, false);
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

test("fitsContextWindow validates its inputs", () => {
  assert.throws(
    () => fitsContextWindow({ text: "hello" }, "gpt-4o"),
    /input must be a string or an array of messages/
  );
  assert.throws(
    () => fitsContextWindow("hello", "gpt-4o", -1),
    /maxOutputTokens must be a non-negative integer/
  );
});

test("estimateCost returns totals for text input", () => {
  const result = estimateCost("Summarize this issue.", "gpt-4o", {
    outputTokens: 500
  });

  assert.equal(result.provider, "openai");
  assert.equal(result.model, "gpt-4o");
  assert.ok(result.inputTokens >= 1);
  assert.equal(result.outputTokensReserved, 500);
  assert.equal(result.totalTokensEstimated, result.inputTokens + 500);
  assert.ok(result.estimatedInputCost > 0);
  assert.ok(result.estimatedOutputCost > 0);
  assert.ok(result.estimatedTotalCost > result.estimatedInputCost);
});

test("estimateCost supports message arrays and fallback pricing", () => {
  const result = estimateCost(
    [{ role: "user", content: "Summarize this issue and key risks." }],
    "claude-3-5-sonnet"
  );

  assert.equal(result.provider, "claude");
  assert.equal(result.outputTokensReserved, 0);
  assert.ok(result.estimatedInputCost > 0);
});

test("estimateCost validates options", () => {
  assert.throws(
    () => estimateCost("hello", "gpt-4o", { outputTokens: -1 }),
    /options.outputTokens must be a non-negative integer/
  );
  assert.throws(
    () => estimateCost({ text: "hello" }, "gpt-4o"),
    /input must be a string or an array of messages/
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

test("cli cost mode prints formatted cost output", () => {
  const output = execFileSync(
    process.execPath,
    [
      "./cli.js",
      "--cost",
      "--model",
      "gpt-4o",
      "--output-tokens",
      "100",
      "Explain Kubernetes in 2 sentences."
    ],
    {
      cwd: __dirname,
      encoding: "utf8"
    }
  ).trim();

  assert.match(output, /Tokens:\s+\d+/);
  assert.match(output, /Estimated cost:\s+\$/);
  assert.match(output, /Provider:\s+OpenAI/);
});
