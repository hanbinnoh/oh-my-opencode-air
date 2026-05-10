import { describe, expect, it } from 'bun:test';
import { buildResilienceGuidance } from './guidance';
import {
  detectToolError,
  EXCLUDED_TOOLS_WITH_OWN_HOOKS,
  TOOL_ERROR_PATTERNS,
} from './patterns';
import { createFailureTracker } from './tracker';

describe('patterns', () => {
  it('detects file not found errors', () => {
    const error = detectToolError('Error: ENOENT: no such file or directory');
    expect(error).not.toBeNull();
    expect(error?.patternId).toBe('file_not_found');
    expect(error?.retryable).toBe(true);
  });

  it('detects permission denied errors', () => {
    const error = detectToolError('Error: EACCES: permission denied');
    expect(error).not.toBeNull();
    expect(error?.patternId).toBe('permission_denied');
  });

  it('detects network timeout errors', () => {
    const error = detectToolError('Error: ETIMEDOUT: connection timed out');
    expect(error).not.toBeNull();
    expect(error?.patternId).toBe('network_timeout');
  });

  it('detects rate limit errors', () => {
    const error = detectToolError('Error: 429 Too Many Requests');
    expect(error).not.toBeNull();
    expect(error?.patternId).toBe('rate_limit');
  });

  it('detects invalid argument errors', () => {
    const error = detectToolError(
      'Error: invalid arguments: missing required field',
    );
    expect(error).not.toBeNull();
    expect(error?.patternId).toBe('invalid_arguments');
  });

  it('detects generic errors when no specific pattern matches', () => {
    const error = detectToolError(
      'Error: something completely unknown happened',
    );
    expect(error).not.toBeNull();
    expect(error?.patternId).toBe('generic_error');
  });

  it('returns null for non-error output', () => {
    const error = detectToolError('Successfully completed the operation');
    expect(error).toBeNull();
  });

  it('returns null for empty output', () => {
    const error = detectToolError('');
    expect(error).toBeNull();
  });

  it('has unique pattern IDs', () => {
    const ids = TOOL_ERROR_PATTERNS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('tracker', () => {
  it('records failures', () => {
    const tracker = createFailureTracker();
    const record = tracker.record(
      { sessionID: 's1', tool: 'read', errorPatternId: 'file_not_found' },
      'Error: ENOENT',
    );
    expect(record.count).toBe(1);
  });

  it('increments count on repeated failures', () => {
    const tracker = createFailureTracker();
    const key = {
      sessionID: 's1',
      tool: 'read',
      errorPatternId: 'file_not_found',
    };
    tracker.record(key, 'Error: ENOENT');
    tracker.record(key, 'Error: ENOENT again');
    const record = tracker.record(key, 'Error: ENOENT third time');
    expect(record.count).toBe(3);
  });

  it('detects loops after threshold', () => {
    const tracker = createFailureTracker();
    const key = {
      sessionID: 's1',
      tool: 'read',
      errorPatternId: 'file_not_found',
    };
    tracker.record(key, 'e1');
    tracker.record(key, 'e2');
    tracker.record(key, 'e3');
    expect(tracker.isLoop(key)).toBe(true);
  });

  it('does not detect loop before threshold', () => {
    const tracker = createFailureTracker();
    const key = {
      sessionID: 's1',
      tool: 'read',
      errorPatternId: 'file_not_found',
    };
    tracker.record(key, 'e1');
    tracker.record(key, 'e2');
    expect(tracker.isLoop(key)).toBe(false);
  });

  it('resets session data', () => {
    const tracker = createFailureTracker();
    const key = {
      sessionID: 's1',
      tool: 'read',
      errorPatternId: 'file_not_found',
    };
    tracker.record(key, 'e1');
    tracker.resetSession('s1');
    expect(tracker.getFailureCount(key)).toBe(0);
  });
});

describe('guidance', () => {
  it('includes fix hint for retryable errors', () => {
    const guidance = buildResilienceGuidance(
      {
        patternId: 'file_not_found',
        category: 'filesystem',
        retryable: true,
        fixHint: 'Check the path.',
        originalOutput: 'Error: ENOENT',
      },
      { count: 1, firstSeen: 0, lastSeen: 0, outputs: ['Error: ENOENT'] },
      false,
    );
    expect(guidance).toContain('Error type: file_not_found');
    expect(guidance).toContain('Check the path.');
    expect(guidance).toContain('Retryable: yes');
  });

  it('warns about non-retryable errors', () => {
    const guidance = buildResilienceGuidance(
      {
        patternId: 'tool_not_found',
        category: 'system',
        retryable: false,
        fixHint: 'Install the tool.',
        originalOutput: 'Error: command not found',
      },
      {
        count: 1,
        firstSeen: 0,
        lastSeen: 0,
        outputs: ['Error: command not found'],
      },
      false,
    );
    expect(guidance).toContain('Retryable: no');
    expect(guidance).toContain('not retryable');
  });

  it('detects retry loops', () => {
    const guidance = buildResilienceGuidance(
      {
        patternId: 'file_not_found',
        category: 'filesystem',
        retryable: true,
        fixHint: 'Check the path.',
        originalOutput: 'Error: ENOENT',
      },
      { count: 3, firstSeen: 0, lastSeen: 0, outputs: ['e1', 'e2', 'e3'] },
      true,
    );
    expect(guidance).toContain('[RETRY LOOP DETECTED]');
    expect(guidance).toContain('STOP retrying');
  });
});

describe('EXCLUDED_TOOLS_WITH_OWN_HOOKS', () => {
  it('contains expected tools', () => {
    expect(EXCLUDED_TOOLS_WITH_OWN_HOOKS.has('task')).toBe(true);
    expect(EXCLUDED_TOOLS_WITH_OWN_HOOKS.has('bash')).toBe(true);
    expect(EXCLUDED_TOOLS_WITH_OWN_HOOKS.has('webfetch')).toBe(true);
  });
});
