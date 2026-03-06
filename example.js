"use strict";

const {
  countTokens,
  countMessages,
  getModelInfo,
  fitsContextWindow,
  estimateCost
} = require("./index");

const sample = [
  "You are reviewing a support escalation.",
  "Summarize the issue, identify the customer impact,",
  "and produce three next steps for the engineering team."
].join(" ");

console.log("OpenAI (gpt-4o):", countTokens(sample, "gpt-4o"));
console.log("OpenAI (o3-mini):", countTokens(sample, "o3-mini"));
console.log("Gemini (gemini-2.0-flash):", countTokens(sample, "gemini-2.0-flash"));
console.log("Claude (claude-3-5-sonnet):", countTokens(sample, "claude-3-5-sonnet"));
console.log("Claude (sonnet-4):", countTokens(sample, "sonnet-4"));
console.log("Claude (opus 4.6):", countTokens(sample, "opus 4.6"));

const messages = [
  {
    role: "system",
    content: "You summarize incidents for an engineering leadership team."
  },
  {
    role: "user",
    content: "Review the outage details and return the top three risks."
  }
];

console.log("Chat messages (gpt-4o):", countMessages(messages, "gpt-4o"));
console.log("Chat messages (gemini-1.5-pro):", countMessages(messages, "gemini-1.5-pro"));
console.log("Model info (sonnet-4):", getModelInfo("sonnet-4"));
console.log(
  "Fits context window (gpt-4o):",
  fitsContextWindow(sample, "gpt-4o", 2000)
);
console.log(
  "Estimated cost (gpt-4o):",
  estimateCost(sample, "gpt-4o", { outputTokens: 500 })
);
