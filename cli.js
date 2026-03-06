#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { countTokens, countMessages, estimateCost, getModelInfo } = require("./index");

function printUsage() {
  console.log(
    "Usage: ai-token-counter [text] --model <model> [--file <path> | --messages-file <path> | --stdin] [--cost] [--output-tokens <n>] [--json]"
  );
  console.log("");
  console.log("Examples:");
  console.log('  ai-token-counter "Summarize this PR" --model gpt-4o');
  console.log("  ai-token-counter --model sonnet-4 --file ./prompt.txt");
  console.log("  ai-token-counter --model sonnet-4 --messages-file ./messages.json");
  console.log('  echo "Summarize this issue" | ai-token-counter --stdin --model gpt-4o');
  console.log(
    '  ai-token-counter --cost --model gpt-4o "Explain Kubernetes in 2 sentences"'
  );
  console.log('  ai-token-counter --json --model gpt-4o "Summarize this issue"');
}

function parseArgs(argv) {
  const args = {
    textParts: [],
    model: null,
    file: null,
    messagesFile: null,
    stdin: false,
    help: false,
    cost: false,
    outputTokens: 0,
    json: false
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

    if (arg === "--json") {
      args.json = true;
      continue;
    }

    if (arg === "--stdin") {
      args.stdin = true;
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

    if (arg === "--messages-file" || arg === "--messagesFile") {
      index += 1;
      args.messagesFile = argv[index] || null;
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

function loadInput(parsedArgs) {
  const inputSourceCount = Number(Boolean(parsedArgs.file)) +
    Number(Boolean(parsedArgs.messagesFile)) +
    Number(Boolean(parsedArgs.stdin));

  if (inputSourceCount > 1) {
    throw new Error(
      "Use only one explicit input source: --file, --messages-file, or --stdin."
    );
  }

  if (parsedArgs.file && parsedArgs.messagesFile) {
    throw new Error("Use either --file or --messages-file, not both.");
  }

  if (parsedArgs.stdin && parsedArgs.textParts.length > 0) {
    throw new Error("Do not pass inline text when using --stdin.");
  }

  if (parsedArgs.stdin) {
    const raw = fs.readFileSync(0, "utf8");
    const trimmed = raw.trim();

    if (!trimmed) {
      return {
        kind: "text",
        value: ""
      };
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return {
          kind: "messages",
          value: parsed
        };
      }
    } catch (error) {
      // Treat non-JSON stdin as plain text input.
    }

    return {
      kind: "text",
      value: raw
    };
  }

  if (parsedArgs.messagesFile) {
    const filePath = path.resolve(process.cwd(), parsedArgs.messagesFile);
    const raw = fs.readFileSync(filePath, "utf8");
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error("messages file must contain valid JSON.");
    }

    if (!Array.isArray(parsed)) {
      throw new Error("messages file must be a JSON array of message objects.");
    }

    return {
      kind: "messages",
      value: parsed
    };
  }

  if (parsedArgs.file) {
    const filePath = path.resolve(process.cwd(), parsedArgs.file);
    return {
      kind: "text",
      value: fs.readFileSync(filePath, "utf8")
    };
  }

  return {
    kind: "text",
    value: parsedArgs.textParts.join(" ")
  };
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

    const input = loadInput(parsedArgs);

    if (
      (input.kind === "text" && !input.value) ||
      (input.kind === "messages" && input.value.length === 0)
    ) {
      throw new Error(
        "Provide text directly, use --file <path>, or use --messages-file <path>."
      );
    }

    if (parsedArgs.cost) {
      const estimate = estimateCost(input.value, parsedArgs.model, {
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

      if (parsedArgs.json) {
        console.log(
          JSON.stringify(
            {
              mode: "cost",
              inputType: input.kind,
              provider: info.provider,
              model: estimate.model,
              inputTokens: estimate.inputTokens,
              outputTokensReserved: estimate.outputTokensReserved,
              totalTokensEstimated: estimate.totalTokensEstimated,
              estimatedInputCost: estimate.estimatedInputCost,
              estimatedOutputCost: estimate.estimatedOutputCost,
              estimatedTotalCost: estimate.estimatedTotalCost
            },
            null,
            2
          )
        );
        process.exit(0);
      }

      console.log(`Tokens: ${estimate.inputTokens}`);
      console.log(`Estimated cost: $${estimate.estimatedTotalCost.toFixed(6)}`);
      console.log(`Provider: ${providerLabel}`);
      process.exit(0);
    }

    const tokens =
      input.kind === "messages"
        ? countMessages(input.value, parsedArgs.model)
        : countTokens(input.value, parsedArgs.model);

    if (parsedArgs.json) {
      const info = getModelInfo(parsedArgs.model);
      console.log(
        JSON.stringify(
          {
            mode: "tokens",
            inputType: input.kind,
            provider: info.provider,
            model: info.normalizedModel,
            tokens
          },
          null,
          2
        )
      );
      process.exit(0);
    }

    console.log(tokens);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
