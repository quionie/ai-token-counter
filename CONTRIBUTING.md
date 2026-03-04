# Contributing

Thanks for contributing to `ai-token-counter`.

## Development

Clone the repository and install dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test
```

Run the local example:

```bash
node example.js
```

Run the CLI locally:

```bash
node cli.js "Summarize this prompt." --model gpt-4o
```

## Contribution Guidelines

Please keep changes focused and practical.

- Keep the package lightweight and dependency-free unless there is a strong technical reason not to.
- Add or update tests for behavior changes.
- Update the README when public behavior, examples, or supported models change.
- Prefer backward-compatible improvements unless a breaking change is clearly justified.

## Areas That Need Help

- Better heuristic coverage for additional model naming patterns
- More benchmark fixtures for code, JSON, markdown, and multilingual prompts
- CLI improvements, including chat-message and JSON file support
- TypeScript definitions for stronger editor support

## Pull Requests

Before opening a pull request:

1. Run `npm test`.
2. Confirm examples still work.
3. Keep the PR description specific about the problem and the tradeoffs.

Small, well-scoped pull requests are preferred.
