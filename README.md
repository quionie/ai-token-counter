# ai-token-counter

A small Node.js utility for rough token estimation across OpenAI and Claude model families.

`ai-token-counter` is designed for developers who want a quick token estimate before sending prompts to an API, storing request budgets, or validating prompt size in tooling. It is intentionally lightweight and dependency-free.

This library provides a fast approximation, not an exact tokenizer. Actual provider token counts may vary.

## Why use it

- Fast rough token estimation with no external dependencies
- Simple CommonJS API for Node.js scripts and backend tools
- Works across common OpenAI and Claude naming patterns
- Useful for prompt budgeting, guards, logging, and quick preflight checks

## Installation

Install from npm:

```bash
npm install ai-token-counter
```

Or add it with your preferred package manager:

```bash
yarn add ai-token-counter
```

```bash
pnpm add ai-token-counter
```

## Usage

```js
const { countTokens } = require("ai-token-counter");

const prompt = `
You are a helpful assistant.
Summarize the following customer feedback in three bullet points
and highlight the main risk.
`;

const openAiEstimate = countTokens(prompt, "gpt-4o");
const claudeEstimate = countTokens(prompt, "claude-3-5-sonnet");

console.log("OpenAI estimate:", openAiEstimate);
console.log("Claude estimate:", claudeEstimate);
```

You can use the estimate to enforce prompt limits in your application:

```js
const { countTokens } = require("ai-token-counter");

function canSendPrompt(text, model, maxTokens) {
  return countTokens(text, model) <= maxTokens;
}

console.log(canSendPrompt("Write a short product description.", "gpt-4.1-mini", 100));
```

## API

### `countTokens(text, model)`

Returns a rough integer token estimate for the supplied `text` and `model`.

- `text`: string input to estimate
- `model`: model name string, such as `gpt-4o`, `gpt-4.1-mini`, `o3-mini`, `claude-3-opus`, or `claude-3-5-sonnet`

Returns a rounded integer estimate. An error is thrown for unsupported model names or invalid input types.

## Supported Models

The library uses provider-family heuristics based on the model name string.

OpenAI-style names:

- OpenAI: models containing `gpt`, `o1`, `o3`, `o4`, `text-embedding`, or `openai`

Examples:

- `gpt-4o`
- `gpt-4.1-mini`
- `o1`
- `o3-mini`
- `text-embedding-3-small`

Claude-style names:

- Claude: models containing `claude` or `anthropic`

Examples:

- `claude-3-haiku`
- `claude-3-opus`
- `claude-3-5-sonnet`
- `anthropic/claude-3-7-sonnet`

If a model name does not match one of these families, `countTokens` throws a `RangeError`.

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

## Contributing

Contributions are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch for your change.
3. Make your updates and keep the package dependency-free unless there is a strong reason not to.
4. Run `npm test`.
5. Open a pull request with a clear description of the change and the reasoning behind it.

Good contribution ideas:

- Improve estimation heuristics for additional OpenAI or Claude model naming patterns
- Add edge-case tests for mixed-language or punctuation-heavy prompts
- Improve docs and examples for real-world prompt budgeting workflows

## Publishing

The package includes the required metadata to publish on npm. Before publishing:

1. Update the version in `package.json`.
2. Ensure you are logged in with `npm login`.
3. Run `npm publish --access public`.

## License

MIT
