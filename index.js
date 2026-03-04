"use strict";

const CJK_PATTERN =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const WORD_PATTERN = /[A-Za-z]+(?:'[A-Za-z]+)*/g;
const NUMBER_PATTERN = /\d+(?:[.,:/-]\d+)*/g;
const PUNCTUATION_PATTERN = /[!-/:-@[-`{-~]/g;
const EMOJI_PATTERN =
  /[\u{1f300}-\u{1f5ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1f900}-\u{1f9ff}\u{1fa70}-\u{1faff}]/gu;
const MODEL_PROFILES = {
  openai: {
    family: "openai",
    contextWindow: 128000,
    supportsMessages: true,
    matchers: ["gpt", "o1", "o3", "o4", "text-embedding", "openai"]
  },
  gemini: {
    family: "gemini",
    contextWindow: 1000000,
    supportsMessages: true,
    matchers: ["gemini", "google"]
  },
  claude: {
    family: "claude",
    contextWindow: 200000,
    supportsMessages: true,
    matchers: ["claude", "anthropic", "haiku", "sonnet", "opus"]
  }
};

function normalizeModel(model) {
  if (typeof model !== "string" || model.trim() === "") {
    throw new TypeError("model must be a non-empty string");
  }

  return model.toLowerCase().replace(/[\s_/.:]+/g, "-");
}

function resolveModelProfile(model) {
  const normalizedModel = normalizeModel(model);

  for (const [provider, profile] of Object.entries(MODEL_PROFILES)) {
    for (const matcher of profile.matchers) {
      if (normalizedModel.includes(matcher)) {
        return {
          provider,
          profile,
          normalizedModel,
          matchedBy: matcher
        };
      }
    }
  }

  throw new RangeError(
    "Unsupported model. Use an OpenAI, Gemini, or Claude model name."
  );
}

function detectProvider(model) {
  return resolveModelProfile(model).provider;
}

function getModelInfo(model) {
  const { provider, profile, normalizedModel, matchedBy } =
    resolveModelProfile(model);

  return {
    provider,
    family: profile.family,
    normalizedModel,
    contextWindow: profile.contextWindow,
    supportsMessages: profile.supportsMessages,
    matchedBy
  };
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function countWordTokens(text) {
  const words = text.match(WORD_PATTERN) || [];
  let total = 0;

  for (const word of words) {
    const length = word.length;

    if (length <= 4) {
      total += 1;
      continue;
    }

    total += Math.ceil(length / 4);

    if (/[A-Z]/.test(word) && /[a-z]/.test(word)) {
      total += 0.15;
    }
  }

  return total;
}

function estimateBaseTokens(text) {
  const cjkCount = countMatches(text, CJK_PATTERN);
  const punctuationCount = countMatches(text, PUNCTUATION_PATTERN);
  const numberGroups = countMatches(text, NUMBER_PATTERN);
  const emojiCount = countMatches(text, EMOJI_PATTERN);
  const whitespaceGroups = countMatches(text, /\s+/g);
  const wordTokens = countWordTokens(text);
  const visibleChars = text.replace(/\s/g, "").length;
  const latinLikeChars = Math.max(
    0,
    visibleChars - cjkCount - punctuationCount - emojiCount
  );
  const residualChars = Math.max(0, latinLikeChars - countMatches(text, WORD_PATTERN));

  return {
    cjkCount,
    punctuationCount,
    numberGroups,
    emojiCount,
    whitespaceGroups,
    wordTokens,
    residualChars
  };
}

function countTokens(text, model) {
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }

  if (text.length === 0) {
    return 0;
  }

  const provider = detectProvider(model);
  const {
    cjkCount,
    punctuationCount,
    numberGroups,
    emojiCount,
    whitespaceGroups,
    wordTokens,
    residualChars
  } = estimateBaseTokens(text);

  const openAiEstimate =
    wordTokens +
    cjkCount * 1.55 +
    numberGroups * 0.9 +
    punctuationCount * 0.33 +
    whitespaceGroups * 0.12 +
    emojiCount * 2.2 +
    residualChars * 0.25 +
    0.5;

  const claudeEstimate =
    wordTokens * 0.96 +
    cjkCount * 1.4 +
    numberGroups * 0.85 +
    punctuationCount * 0.28 +
    whitespaceGroups * 0.1 +
    emojiCount * 2 +
    residualChars * 0.22 +
    0.35;

  const geminiEstimate =
    wordTokens * 0.98 +
    cjkCount * 1.48 +
    numberGroups * 0.88 +
    punctuationCount * 0.3 +
    whitespaceGroups * 0.11 +
    emojiCount * 2.1 +
    residualChars * 0.23 +
    0.4;

  let estimate = claudeEstimate;

  if (provider === "openai") {
    estimate = openAiEstimate;
  } else if (provider === "gemini") {
    estimate = geminiEstimate;
  }

  return Math.max(1, Math.ceil(estimate));
}

function countMessages(messages, model) {
  if (!Array.isArray(messages)) {
    throw new TypeError("messages must be an array");
  }

  if (messages.length === 0) {
    return 0;
  }

  detectProvider(model);

  let total = 0;

  for (const message of messages) {
    if (!message || typeof message !== "object") {
      throw new TypeError("each message must be an object");
    }

    const role = typeof message.role === "string" ? message.role : "";
    const content = message.content;

    if (typeof content !== "string") {
      throw new TypeError("each message content must be a string");
    }

    // Chat payloads include some structure beyond raw text, so add a small
    // overhead for each message plus a tiny role cost.
    total += countTokens(content, model);
    total += 3;

    if (role) {
      total += Math.max(1, Math.ceil(role.length / 8));
    }

    if (message.name && typeof message.name === "string") {
      total += Math.max(1, Math.ceil(message.name.length / 8));
    }
  }

  return total;
}

function fitsContextWindow(input, model, maxOutputTokens) {
  const modelInfo = getModelInfo(model);
  const reservedOutputTokens =
    maxOutputTokens === undefined ? 0 : maxOutputTokens;

  if (!Number.isInteger(reservedOutputTokens) || reservedOutputTokens < 0) {
    throw new TypeError(
      "maxOutputTokens must be a non-negative integer when provided"
    );
  }

  let inputTokens;

  if (typeof input === "string") {
    inputTokens = countTokens(input, model);
  } else if (Array.isArray(input)) {
    inputTokens = countMessages(input, model);
  } else {
    throw new TypeError("input must be a string or an array of messages");
  }

  const availableInputTokens = Math.max(
    0,
    modelInfo.contextWindow - reservedOutputTokens
  );

  return {
    fits: inputTokens <= availableInputTokens,
    inputTokens,
    reservedOutputTokens,
    availableInputTokens,
    contextWindow: modelInfo.contextWindow,
    model: modelInfo.normalizedModel,
    provider: modelInfo.provider
  };
}

module.exports = {
  countTokens,
  countMessages,
  getModelInfo,
  fitsContextWindow
};
