# ai-token-counter

[![npm version](https://img.shields.io/npm/v/ai-token-counter)](https://www.npmjs.com/package/ai-token-counter)
[![license](https://img.shields.io/npm/l/ai-token-counter)](./LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/ai-token-counter)](https://www.npmjs.com/package/ai-token-counter)
[![CI](https://img.shields.io/github/actions/workflow/status/quionie/ai-token-counter/ci.yml?branch=main&label=ci)](https://github.com/quionie/ai-token-counter/actions/workflows/ci.yml)

A small, dependency-free Node.js utility for rough token estimation across OpenAI and Claude model families.

`ai-token-counter` helps developers estimate prompt size before making API calls. It is built for simple scripts, backend services, and internal tooling where you need a fast approximation without pulling in a full tokenizer.

It is intentionally lightweight and fast. The tradeoff is that estimates are approximate, not exact. Real provider token counts may differ.

The estimator now uses a chunk-based heuristic that weighs words, numbers, punctuation, CJK characters, and emoji separately, which produces more realistic results than a plain character count.

## Highlights

- Dependency-free Node.js package
- Simple API for both plain text and chat-style messages
- Small CLI for fast prompt checks in scripts and terminals
- Supports common OpenAI and Claude naming patterns
- Built for lightweight prompt budgeting and preflight validation

## Quick Start

Install:

```bash
npm install ai-token-counter
```

Estimate text:

```js
const { countTokens } = require("ai-token-counter");

console.log(countTokens("Summarize this support issue.", "gpt-4o"));
```

Estimate chat messages:

```js
const { countMessages } = require("ai-token-counter");

const messages = [
  { role: "system", content: "You are a concise assistant." },
  { role: "user", content: "Summarize this outage report." }
];

console.log(countMessages(messages, "sonnet-4"));
```

## What problem it solves

When building with LLM APIs, it is common to need a quick estimate of prompt size before sending a request. Exact tokenization can be overkill for:

- prompt budget checks before an API call
- request validation in backend services
- logging and analytics for prompt sizes
- simple CLI tools or internal automation scripts
- rough cost estimation during development

`ai-token-counter` gives you a simple way to do that with a single function call.

It now supports both raw text estimation and chat-style message arrays.

## Installation

Install with npm:

```bash
npm install ai-token-counter
```

Or with other package managers:

```bash
yarn add ai-token-counter
```

```bash
pnpm add ai-token-counter
```

## Example usage

```js
const { countTokens } = require("ai-token-counter");

const prompt = [
  "You are a helpful assistant.",
  "Summarize the following customer feedback in three bullet points,",
  "highlight the main risk, and suggest a next action."
].join(" ");

const openAiEstimate = countTokens(prompt, "gpt-4o");
const claudeEstimate = countTokens(prompt, "claude-3-5-sonnet");
const claudeAliasEstimate = countTokens(prompt, "sonnet-4");

console.log("OpenAI estimate:", openAiEstimate);
console.log("Claude estimate:", claudeEstimate);
console.log("Claude alias estimate:", claudeAliasEstimate);
```

Chat-style payloads are also supported:

```js
const { countMessages } = require("ai-token-counter");

const messages = [
  {
    role: "system",
    content: "You are a concise coding assistant."
  },
  {
    role: "user",
    content: "Review this pull request summary and list the top two risks."
  }
];

console.log(countMessages(messages, "gpt-4o"));
console.log(countMessages(messages, "sonnet-4"));
```

You can also use the estimate to enforce a rough prompt limit before making a request:

```js
const { countTokens } = require("ai-token-counter");

function canSendPrompt(text, model, maxTokens) {
  return countTokens(text, model) <= maxTokens;
}

console.log(canSendPrompt("Write a short product description.", "gpt-4.1-mini", 100));
```

The library exports:

- `countTokens(text, model)`
- `countMessages(messages, model)`

## CLI

The package also includes a small command-line interface.

Count inline text:

```bash
npx ai-token-counter "Summarize this pull request and call out the main risk." --model gpt-4o
```

Count text from a file:

```bash
npx ai-token-counter --model sonnet-4 --file ./prompt.txt
```

Show help:

```bash
npx ai-token-counter --help
```

## API

### `countTokens(text, model)`

Returns a rough integer token estimate for the supplied `text` and `model`.

- `text`: string input to estimate
- `model`: model name string, such as `gpt-4o`, `gpt-4.1-mini`, `o3-mini`, `claude-3-opus`, `claude-3-5-sonnet`, or `sonnet-4`

Returns a rounded integer estimate. The function throws for unsupported model names or invalid input types.

### `countMessages(messages, model)`

Returns a rough token estimate for a chat-style message array.

- `messages`: an array of objects with `role` and string `content`
- `model`: model name string, such as `gpt-4o`, `o3-mini`, `claude-3-5-sonnet`, or `sonnet-4`

The function sums the estimated content tokens and adds a small overhead for message structure.

## Supported Models

The library uses provider-family heuristics based on the model name string.

### OpenAI

Matches model names containing:

- `gpt`
- `o1`
- `o3`
- `o4`
- `text-embedding`
- `openai`

Examples:

- `gpt-4o`
- `gpt-4.1-mini`
- `o1`
- `o3-mini`
- `text-embedding-3-small`

### Claude

Matches model names containing:

- `claude`
- `anthropic`

Examples:

- `claude-3-haiku`
- `claude-3-opus`
- `claude-3-5-sonnet`
- `anthropic/claude-3-7-sonnet`
- `sonnet-4`
- `haiku-3.5`
- `opus-4`

If a model name does not match one of these families, `countTokens` throws a `RangeError`.

## Why it is approximate

This package uses heuristic estimation rather than provider-native tokenizers. That keeps it lightweight and easy to drop into any Node.js project, but it also means:

- counts are best used as rough planning values
- provider-side totals may differ from local estimates
- exact billing or hard token limits should still be validated against the provider when precision matters

## Example

Run the included example:

```bash
node example.js
```

## Test

Run the built-in test suite:

```bash
npm test
```

## Repository

This repository includes:

- [README.md](./README.md) for package documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- [CHANGELOG.md](./CHANGELOG.md) for release notes
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community expectations
- [SECURITY.md](./SECURITY.md) for security reporting guidance
- [LICENSE](./LICENSE) for licensing terms

## Contributing

Contributions are welcome, especially if they improve the estimation heuristics while keeping the library simple and dependency-free.

To contribute:

1. Fork the repository.
2. Create a feature branch for your change.
3. Make your changes and keep the package dependency-free unless there is a clear reason not to.
4. Run `npm test`.
5. Update the README or examples if behavior changes.
6. Open a pull request with a clear explanation of what changed and why.

Good contribution ideas:

- Improve estimation heuristics for additional OpenAI or Claude model naming patterns
- Add edge-case tests for mixed-language or punctuation-heavy prompts
- Improve docs and examples for real-world prompt budgeting workflows

## Publishing

The package includes the required metadata to publish on npm. Before publishing:

1. Update the version in `package.json`.
2. Run `npm test`.
3. Ensure you are logged in with `npm login`.
4. Run `npm publish --access public`.

## License

MIT
