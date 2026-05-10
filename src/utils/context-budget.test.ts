import { describe, expect, test } from 'bun:test';
import {
  CHARS_PER_TOKEN_CODE,
  CHARS_PER_TOKEN_ENGLISH,
  ContextBudgetManager,
  estimateMessageTokens,
  estimateSystemTokens,
  estimateTokens,
  resolveModelLimit,
  trimMessagesToBudget,
} from './context-budget';

function makeMessage(text: string, role = 'user', isCode = false) {
  return {
    info: { role, agent: 'orchestrator' },
    parts: [{ type: 'text', text, isCode }],
  };
}

function makeMessages(count: number, textLength: number) {
  const text = 'a'.repeat(textLength);
  return Array.from({ length: count }, (_, i) =>
    makeMessage(text, i % 2 === 0 ? 'user' : 'assistant'),
  );
}

describe('estimateTokens', () => {
  test('empty string is 0 tokens', () => {
    expect(estimateTokens('')).toBe(0);
  });

  test('short text english', () => {
    expect(estimateTokens('hello')).toBe(2);
  });

  test('short text code', () => {
    expect(estimateTokens('hello', true)).toBe(3);
  });

  test('exact multiple english', () => {
    expect(estimateTokens('a'.repeat(CHARS_PER_TOKEN_ENGLISH))).toBe(1);
  });

  test('exact multiple code', () => {
    expect(estimateTokens('a'.repeat(CHARS_PER_TOKEN_CODE), true)).toBe(1);
  });
});

describe('estimateMessageTokens', () => {
  test('empty message has overhead only', () => {
    const msg = { info: { role: 'user' }, parts: [] };
    expect(estimateMessageTokens(msg)).toBe(4);
  });

  test('message with text part', () => {
    const msg = makeMessage('hello world');
    expect(estimateMessageTokens(msg)).toBe(4 + 3);
  });

  test('message with code part', () => {
    const msg = makeMessage('hello world', 'user', true);
    expect(estimateMessageTokens(msg)).toBe(4 + 6);
  });

  test('tool-result is treated as code', () => {
    const msg = {
      info: { role: 'user' },
      parts: [{ type: 'tool-result', text: 'hello world' }],
    };
    expect(estimateMessageTokens(msg)).toBe(4 + 6);
  });
});

describe('estimateSystemTokens', () => {
  test('empty array is 0', () => {
    expect(estimateSystemTokens([])).toBe(0);
  });

  test('single string', () => {
    expect(estimateSystemTokens(['hello'])).toBe(4 + 2);
  });

  test('multiple strings are joined', () => {
    expect(estimateSystemTokens(['hello', 'world'])).toBe(
      estimateTokens('hello\n\nworld') + 4,
    );
  });
});

describe('resolveModelLimit', () => {
  test('known model by id', () => {
    expect(resolveModelLimit('qwen3.5-397b')).toBe(128_000);
  });

  test('known model with provider prefix', () => {
    expect(resolveModelLimit('onprem/qwen3.5-397b')).toBe(128_000);
  });

  test('unknown model falls back to default', () => {
    expect(resolveModelLimit('unknown/model')).toBe(32_000);
  });

  test('override wins', () => {
    expect(resolveModelLimit('qwen3.5-397b', { 'qwen3.5-397b': 64_000 })).toBe(
      64_000,
    );
  });
});

describe('trimMessagesToBudget', () => {
  test('no trimming when under budget', () => {
    const messages = makeMessages(3, 100);
    const result = trimMessagesToBudget(messages, 100_000, 0);
    expect(result.trimmed).toBe(false);
    expect(result.removedCount).toBe(0);
    expect(result.isWarning).toBe(false);
  });

  test('warns at 70%', () => {
    const messages = makeMessages(1, 75_000 * 4); // 75k tokens
    const result = trimMessagesToBudget(messages, 100_000, 0);
    expect(result.trimmed).toBe(false);
    expect(result.isWarning).toBe(true);
  });

  test('trims at 90%', () => {
    const messages = makeMessages(10, 10_000 * 4); // 100k tokens total
    const result = trimMessagesToBudget(messages, 100_000, 0);
    expect(result.trimmed).toBe(true);
    expect(result.removedCount).toBeGreaterThan(0);
    expect(result.finalTokens).toBeLessThanOrEqual(90_000);
  });

  test('never removes the last message', () => {
    const messages = makeMessages(1, 100_000 * 4);
    const result = trimMessagesToBudget(messages, 100_000, 0);
    expect(result.trimmed).toBe(false);
    expect(result.removedCount).toBe(0);
  });
});

describe('ContextBudgetManager', () => {
  test('disabled manager does nothing', () => {
    const manager = new ContextBudgetManager({ enabled: false });
    const messages = makeMessages(10, 10_000 * 4);
    const result = manager.enforceBudget({
      model: 'default',
      system: [],
      messages,
    });
    expect(result.trimmed).toBe(false);
    expect(messages.length).toBe(10);
  });

  test('trims when over budget', () => {
    const manager = new ContextBudgetManager();
    const messages = makeMessages(10, 10_000 * 4);
    const result = manager.enforceBudget({
      model: 'default', // 32k limit
      system: [],
      messages,
    });
    expect(result.trimmed).toBe(true);
    expect(messages.length).toBeLessThan(10);
  });
});
