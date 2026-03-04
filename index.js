"use strict";

function detectProvider(model) {
  if (typeof model !== "string" || model.trim() === "") {
    throw new TypeError("model must be a non-empty string");
  }

  const normalizedModel = model.toLowerCase();

  if (
    normalizedModel.includes("gpt") ||
    normalizedModel.includes("o1") ||
    normalizedModel.includes("o3") ||
    normalizedModel.includes("o4") ||
    normalizedModel.includes("text-embedding") ||
    normalizedModel.includes("openai")
  ) {
    return "openai";
  }

  if (
    normalizedModel.includes("claude") ||
    normalizedModel.includes("anthropic")
  ) {
    return "claude";
  }

  throw new RangeError(
    "Unsupported model. Use an OpenAI or Claude model name."
  );
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function countTokens(text, model) {
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }

  if (text.length === 0) {
    return 0;
  }

  const provider = detectProvider(model);
  const cjkCount = countMatches(text, /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g);
  const punctuationCount = countMatches(text, /[!-/:-@[-`{-~]/g);
  const whitespaceGroups = countMatches(text, /\s+/g);
  const visibleChars = text.replace(/\s/g, "").length;
  const latinLikeChars = Math.max(0, visibleChars - cjkCount);

  const openAiEstimate =
    latinLikeChars / 4 +
    cjkCount * 1.6 +
    punctuationCount * 0.5 +
    whitespaceGroups * 0.25;

  const claudeEstimate =
    latinLikeChars / 4.2 +
    cjkCount * 1.45 +
    punctuationCount * 0.45 +
    whitespaceGroups * 0.2;

  const estimate = provider === "openai" ? openAiEstimate : claudeEstimate;

  return Math.max(1, Math.ceil(estimate));
}

module.exports = {
  countTokens
};
