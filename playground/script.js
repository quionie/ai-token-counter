"use strict";

const modelSelect = document.getElementById("model-select");
const promptInput = document.getElementById("prompt-input");
const resultTitle = document.getElementById("result-title");
const tokenEstimate = document.getElementById("token-estimate");
const costEstimate = document.getElementById("cost-estimate");
const contextUsage = document.getElementById("context-usage");
const providerValue = document.getElementById("provider-value");

const modelProfiles = {
  openai: {
    label: "OpenAI",
    contextWindow: 128000,
    matchers: ["gpt", "o1", "o3", "o4", "text-embedding", "openai"]
  },
  gemini: {
    label: "Google Gemini",
    contextWindow: 1000000,
    matchers: ["gemini", "google"]
  },
  claude: {
    label: "Claude",
    contextWindow: 200000,
    matchers: ["claude", "anthropic", "haiku", "sonnet", "opus"]
  }
};

const pricing = {
  openai: {
    default: { input: 1 / 1000000, output: 4 / 1000000 },
    "gpt-4o": { input: 5 / 1000000, output: 15 / 1000000 },
    "gpt-4.1-mini": { input: 0.15 / 1000000, output: 0.6 / 1000000 }
  },
  anthropic: {
    default: { input: 3 / 1000000, output: 15 / 1000000 },
    "sonnet-4": { input: 3 / 1000000, output: 15 / 1000000 }
  },
  google: {
    default: { input: 1.25 / 1000000, output: 5 / 1000000 },
    "gemini-1.5-pro": { input: 3.5 / 1000000, output: 10.5 / 1000000 }
  }
};

function normalizeModel(model) {
  return model.toLowerCase().replace(/[\s_/.:]+/g, "-");
}

function resolveProvider(model) {
  const normalizedModel = normalizeModel(model);

  for (const [provider, profile] of Object.entries(modelProfiles)) {
    for (const matcher of profile.matchers) {
      if (normalizedModel.includes(matcher)) {
        return {
          provider,
          normalizedModel,
          profile
        };
      }
    }
  }

  return {
    provider: "openai",
    normalizedModel,
    profile: modelProfiles.openai
  };
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function countWordTokens(text) {
  const words = text.match(/[A-Za-z]+(?:'[A-Za-z]+)*/g) || [];
  let total = 0;

  for (const word of words) {
    const length = word.length;
    total += length <= 4 ? 1 : Math.ceil(length / 4);
  }

  return total;
}

function estimateTokens(text, provider) {
  if (!text) {
    return 0;
  }

  const cjkCount = countMatches(text, /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g);
  const punctuationCount = countMatches(text, /[!-/:-@[-`{-~]/g);
  const numberGroups = countMatches(text, /\d+(?:[.,:/-]\d+)*/g);
  const emojiCount = countMatches(
    text,
    /[\u{1f300}-\u{1f5ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1f900}-\u{1f9ff}\u{1fa70}-\u{1faff}]/gu
  );
  const whitespaceGroups = countMatches(text, /\s+/g);
  const wordTokens = countWordTokens(text);
  const visibleChars = text.replace(/\s/g, "").length;
  const latinLikeChars = Math.max(
    0,
    visibleChars - cjkCount - punctuationCount - emojiCount
  );
  const residualChars = Math.max(
    0,
    latinLikeChars - countMatches(text, /[A-Za-z]+(?:'[A-Za-z]+)*/g)
  );

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

  const estimate =
    provider === "openai"
      ? openAiEstimate
      : provider === "gemini"
        ? geminiEstimate
        : claudeEstimate;

  return Math.max(1, Math.ceil(estimate));
}

function resolvePricing(provider, normalizedModel) {
  const pricingProvider =
    provider === "claude" ? "anthropic" : provider === "gemini" ? "google" : "openai";
  const providerPricing = pricing[pricingProvider];
  const exact = providerPricing[normalizedModel];

  if (exact) {
    return exact;
  }

  return providerPricing.default;
}

function updateResults() {
  const prompt = promptInput.value;
  const model = modelSelect.value;
  const { provider, normalizedModel, profile } = resolveProvider(model);
  const tokens = estimateTokens(prompt, provider);
  const unitPricing = resolvePricing(provider, normalizedModel);
  const cost = tokens * unitPricing.input;
  const usagePercent = profile.contextWindow === 0
    ? 0
    : (tokens / profile.contextWindow) * 100;
  const contextCompact =
    profile.contextWindow >= 1000000
      ? `${profile.contextWindow / 1000000}M`
      : `${Math.round(profile.contextWindow / 1000)}k`;

  resultTitle.textContent = `${profile.label} ${model}`;
  tokenEstimate.textContent = String(tokens);
  costEstimate.textContent = `$${cost.toFixed(6)}`;
  contextUsage.textContent = `${usagePercent.toFixed(2)}% of ${contextCompact}`;
  providerValue.textContent = profile.label;
}

promptInput.addEventListener("input", updateResults);
modelSelect.addEventListener("change", updateResults);
updateResults();
