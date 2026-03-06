export interface CountMessage {
  role?: string;
  content: string;
  name?: string;
}

export interface ModelInfo {
  provider: "openai" | "gemini" | "claude";
  family: string;
  normalizedModel: string;
  contextWindow: number;
  supportsMessages: boolean;
  matchedBy: string;
}

export interface ContextWindowResult {
  fits: boolean;
  inputTokens: number;
  reservedOutputTokens: number;
  availableInputTokens: number;
  contextWindow: number;
  model: string;
  provider: "openai" | "gemini" | "claude";
}

export interface EstimateCostOptions {
  outputTokens?: number;
}

export interface EstimateCostResult {
  provider: "openai" | "gemini" | "claude";
  model: string;
  inputTokens: number;
  outputTokensReserved: number;
  totalTokensEstimated: number;
  estimatedInputCost: number;
  estimatedOutputCost: number;
  estimatedTotalCost: number;
}

export declare function countTokens(text: string, model: string): number;

export declare function countMessages(
  messages: CountMessage[],
  model: string
): number;

export declare function getModelInfo(model: string): ModelInfo;

export declare function fitsContextWindow(
  input: string | CountMessage[],
  model: string,
  maxOutputTokens?: number
): ContextWindowResult;

export declare function estimateCost(
  input: string | CountMessage[],
  model: string,
  options?: EstimateCostOptions
): EstimateCostResult;
