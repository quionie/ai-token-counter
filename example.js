"use strict";

const { countTokens } = require("./index");

const sample = "Summarize this text, then return three concise bullet points.";

console.log("OpenAI (gpt-4o):", countTokens(sample, "gpt-4o"));
console.log("OpenAI (o3-mini):", countTokens(sample, "o3-mini"));
console.log("Claude (claude-3-5-sonnet):", countTokens(sample, "claude-3-5-sonnet"));
