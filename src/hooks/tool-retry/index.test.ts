import { describe, expect, it } from 'bun:test';
import { createToolRetryHook } from './index';

describe('Tool Retry Hook', () => {
  it('should exist', () => {
    expect(createToolRetryHook).toBeDefined();
  });
});
