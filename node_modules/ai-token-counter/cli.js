#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { countTokens } = require("./index");

function printUsage() {
  console.log("Usage: ai-token-counter [text] --model <model> [--file <path>]");
  console.log("");
  console.log("Examples:");
  console.log('  ai-token-counter "Summarize this PR" --model gpt-4o');
  console.log("  ai-token-counter --model sonnet-4 --file ./prompt.txt");
}

function parseArgs(argv) {
  const args = {
    textParts: [],
    model: null,
    file: null,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
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

    const tokens = countTokens(text, parsedArgs.model);

    console.log(tokens);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
