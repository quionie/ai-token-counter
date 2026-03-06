#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { countTokens, estimateCost, getModelInfo } = require("./index");

function printUsage() {
  console.log(
    "Usage: ai-token-counter [text] --model <model> [--file <path>] [--cost] [--output-tokens <n>]"
  );
  console.log("");
  console.log("Examples:");
  console.log('  ai-token-counter "Summarize this PR" --model gpt-4o');
  console.log("  ai-token-counter --model sonnet-4 --file ./prompt.txt");
  console.log(
    '  ai-token-counter --cost --model gpt-4o "Explain Kubernetes in 2 sentences"'
  );
}

function parseArgs(argv) {
  const args = {
    textParts: [],
    model: null,
    file: null,
    help: false,
    cost: false,
    outputTokens: 0
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    if (arg === "--cost") {
      args.cost = true;
      continue;
    }

    if (arg === "--model") {
      index += 1;
      args.model = argv[index] || null;
      continue;
    }

    if (arg === "--file") {
      index += 1;
      args.file = argv[index] || null;
      continue;
    }

    if (arg === "--output-tokens" || arg === "--outputTokens") {
      index += 1;
      const value = Number(argv[index]);

      if (!Number.isInteger(value) || value < 0) {
        throw new Error("--output-tokens must be a non-negative integer.");
      }

      args.outputTokens = value;
      continue;
    }

    args.textParts.push(arg);
  }

  return args;
}

function loadInputText(parsedArgs) {
  if (parsedArgs.file) {
    const filePath = path.resolve(process.cwd(), parsedArgs.file);
    return fs.readFileSync(filePath, "utf8");
  }

  return parsedArgs.textParts.join(" ");
}

function main() {
  try {
    const parsedArgs = parseArgs(process.argv.slice(2));

    if (parsedArgs.help) {
      printUsage();
      process.exit(0);
    }

    if (!parsedArgs.model) {
      throw new Error("Missing required --model argument.");
    }

    const text = loadInputText(parsedArgs);

    if (!text) {
      throw new Error("Provide text directly or use --file <path>.");
    }

    if (parsedArgs.cost) {
      const estimate = estimateCost(text, parsedArgs.model, {
        outputTokens: parsedArgs.outputTokens
      });
      const info = getModelInfo(parsedArgs.model);
      const providerLabels = {
        openai: "OpenAI",
        claude: "Claude",
        gemini: "Google Gemini"
      };
      const providerLabel =
        providerLabels[info.provider] ||
        info.provider.charAt(0).toUpperCase() + info.provider.slice(1);

      console.log(`Tokens: ${estimate.inputTokens}`);
      console.log(`Estimated cost: $${estimate.estimatedTotalCost.toFixed(6)}`);
      console.log(`Provider: ${providerLabel}`);
      process.exit(0);
    }

    const tokens = countTokens(text, parsedArgs.model);

    console.log(tokens);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
