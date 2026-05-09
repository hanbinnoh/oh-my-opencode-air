import { describe, expect, test } from 'bun:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const testOnPlatform = process.platform === 'win32' ? test.skip : test;

describe('multiplexer factory', () => {
  testOnPlatform('returns a fresh tmux instance per call', async () => {
    process.env.TMUX = join(tmpdir(), 'tmux-1000', 'default,123,0');
    process.env.TMUX_PANE = '%1';

    const { getMultiplexer } = await import('./factory');

    const first = getMultiplexer({
      type: 'tmux',
      layout: 'main-vertical',
      main_pane_size: 60,
    });

    const second = getMultiplexer({
      type: 'tmux',
      layout: 'main-vertical',
      main_pane_size: 60,
    });

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.type).toBe('tmux');
    expect(second?.type).toBe('tmux');
  });

  testOnPlatform(
    'returns a fresh auto-detected tmux instance per call',
    async () => {
      process.env.TMUX = join(tmpdir(), 'tmux-1000', 'default,123,0');
      process.env.TMUX_PANE = '%1';

      const { getMultiplexer } = await import('./factory');

      const result = getMultiplexer({
        type: 'auto',
        layout: 'main-vertical',
        main_pane_size: 60,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe('tmux');
    },
  );
});
