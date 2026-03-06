"use strict";

module.exports = {
  openai: {
    default: {
      input: 1 / 1000000,
      output: 4 / 1000000
    },
    "gpt-4o": {
      input: 5 / 1000000,
      output: 15 / 1000000
    },
    "gpt-4.1-mini": {
      input: 0.15 / 1000000,
      output: 0.6 / 1000000
    }
  },

  anthropic: {
    default: {
      input: 3 / 1000000,
      output: 15 / 1000000
    },
    "sonnet-4": {
      input: 3 / 1000000,
      output: 15 / 1000000
    }
  },

  google: {
    default: {
      input: 1.25 / 1000000,
      output: 5 / 1000000
    },
    "gemini-1.5-pro": {
      input: 3.5 / 1000000,
      output: 10.5 / 1000000
    }
  }
};
