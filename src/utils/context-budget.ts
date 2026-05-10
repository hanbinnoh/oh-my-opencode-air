/**
 * Context Budget Manager — estimates token usage and trims message history
 * to fit within model context window limits.
 */

export const CHARS_PER_TOKEN_ENGLISH = 4;
export const CHARS_PER_TOKEN_CODE = 2;

export const WARNING_THRESHOLD = 0.7;
export const HARD_CUT_THRESHOLD = 0.9;
const ABSOLUTE_MIN_BUDGET = 2048;

export const DEFAULT_MODEL_LIMITS: Record<string, number> = {
  'qwen3.5-397b': 128_000,
  'qwen3.5-72b': 128_000,
  'qwen3.5-32b': 128_000,
  'qwen3-235b': 128_000,
  'qwen2.5-72b': 128_000,
  'qwen2.5-32b': 128_000,
  'qwen2.5-14b': 128_000,
  'qwen2.5-7b': 128_000,
  'minimax-2.5': 32_000,
  'minimax-text-01': 256_000,
  'deepseek-v3': 64_000,
  'deepseek-r1': 64_000,
  'llama3.3-70b': 128_000,
  'llama3.1-70b': 128_000,
  'llama3.1-8b': 128_000,
  default: 32_000,
};

/** Extract model ID from a "provider/model" string. */
function extractModelId(model: string): string {
  const slashIndex = model.indexOf('/');
  return slashIndex >= 0 ? model.slice(slashIndex + 1) : model;
}

/** Look up context limit for a model reference. */
export function resolveModelLimit(
  model: string,
  overrides?: Record<string, number>,
): number {
  const modelId = extractModelId(model);
  const override = overrides?.[modelId] ?? overrides?.[model];
  if (override) return override;
  return DEFAULT_MODEL_LIMITS[modelId] ?? DEFAULT_MODEL_LIMITS.default;
}

/** Estimate token count for a piece of text. */
export function estimateTokens(text: string, isCode: boolean = false): number {
  const charsPerToken = isCode ? CHARS_PER_TOKEN_CODE : CHARS_PER_TOKEN_ENGLISH;
  return Math.ceil(text.length / charsPerToken);
}

function estimatePartTokens(part: {
  type: string;
  text?: string;
  isCode?: boolean;
}): number {
  if (part.type === 'text' && typeof part.text === 'string') {
    return estimateTokens(part.text, part.isCode);
  }
  if (part.type === 'tool-result' && typeof part.text === 'string') {
    return estimateTokens(part.text, true);
  }
  return 512;
}

export function estimateMessageTokens(message: {
  info: { role: string; agent?: string; sessionID?: string };
  parts: Array<{ type: string; text?: string; isCode?: boolean }>;
}): number {
  let tokens = 4;
  for (const part of message.parts) {
    tokens += estimatePartTokens(part);
  }
  return tokens;
}

export function estimateSystemTokens(system: string[]): number {
  if (system.length === 0) return 0;
  return estimateTokens(system.join('\n\n')) + 4;
}

export interface TrimResult {
  trimmed: boolean;
  removedCount: number;
  originalTokens: number;
  finalTokens: number;
  isWarning: boolean;
  usageRatio: number;
}

export function trimMessagesToBudget(
  messages: Array<{
    info: { role: string; agent?: string; sessionID?: string };
    parts: Array<{ type: string; text?: string; isCode?: boolean }>;
  }>,
  modelLimit: number,
  systemTokens: number,
): TrimResult {
  let totalTokens = systemTokens;
  for (const msg of messages) {
    totalTokens += estimateMessageTokens(msg);
  }

  const usageRatio = totalTokens / modelLimit;
  const isWarning = usageRatio >= WARNING_THRESHOLD;
  const hardCutLimit = Math.max(
    modelLimit * HARD_CUT_THRESHOLD,
    ABSOLUTE_MIN_BUDGET,
  );

  if (totalTokens <= hardCutLimit) {
    return {
      trimmed: false,
      removedCount: 0,
      originalTokens: totalTokens,
      finalTokens: totalTokens,
      isWarning,
      usageRatio,
    };
  }

  let tokensIfRemoved = totalTokens;
  let removeCount = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    tokensIfRemoved -= estimateMessageTokens(messages[i]);
    removeCount = i + 1;
    if (tokensIfRemoved <= hardCutLimit) {
      break;
    }
  }

  const finalMessages = messages.slice(removeCount);
  let finalTokens = systemTokens;
  for (const msg of finalMessages) {
    finalTokens += estimateMessageTokens(msg);
  }

  return {
    trimmed: removeCount > 0,
    removedCount: removeCount,
    originalTokens: totalTokens,
    finalTokens,
    isWarning: finalTokens / modelLimit >= WARNING_THRESHOLD,
    usageRatio: finalTokens / modelLimit,
  };
}

export interface ContextBudgetOptions {
  modelLimits?: Record<string, number>;
  enabled?: boolean;
}

export class ContextBudgetManager {
  private readonly modelLimits: Record<string, number>;
  private readonly enabled: boolean;

  constructor(options: ContextBudgetOptions = {}) {
    this.modelLimits = options.modelLimits ?? {};
    this.enabled = options.enabled ?? true;
  }

  resolveLimit(model: string): number {
    return resolveModelLimit(model, this.modelLimits);
  }

  estimate(text: string, isCode: boolean = false): number {
    return estimateTokens(text, isCode);
  }

  enforceBudget(input: {
    model: string;
    system: string[];
    messages: Array<{
      info: { role: string; agent?: string; sessionID?: string };
      parts: Array<{ type: string; text?: string; isCode?: boolean }>;
    }>;
  }): TrimResult {
    if (!this.enabled) {
      return {
        trimmed: false,
        removedCount: 0,
        originalTokens: 0,
        finalTokens: 0,
        isWarning: false,
        usageRatio: 0,
      };
    }

    const limit = this.resolveLimit(input.model);
    const systemTokens = estimateSystemTokens(input.system);

    const result = trimMessagesToBudget(input.messages, limit, systemTokens);

    if (result.trimmed) {
      input.messages.splice(0, result.removedCount);
    }

    return result;
  }
}
