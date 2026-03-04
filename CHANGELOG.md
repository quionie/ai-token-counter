# Changelog

All notable changes to this project will be documented in this file.

## [1.0.4] - 2026-03-04

- Removed an accidental self-dependency from `package.json`
- Normalized package metadata with `npm pkg fix`
- Published a clean release as the current recommended version

## [1.0.3] - 2026-03-04

- Added a CLI via `ai-token-counter`
- Added `countMessages(messages, model)` for chat-style payload estimation
- Expanded Claude naming support for aliases like `sonnet-4`
- Improved token estimation heuristics for mixed content
- Expanded tests and README examples

## [1.0.0] - 2026-03-04

- Initial public release of `ai-token-counter`
