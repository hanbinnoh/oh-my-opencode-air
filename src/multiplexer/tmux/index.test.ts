import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

type SpawnResult = {
  exited: Promise<number>;
  stdout: () => Promise<string>;
  stderr: () => Promise<string>;
  kill: () => boolean;
  exitCode: number | null;
  proc: never;
};

const logMock = mock(() => {});
const crossSpawnMock = mock((_command: string[]) => createSpawnResult());

mock.module('../../utils/logger', () => ({
  log: logMock,
}));

mock.module('../../utils/compat', () => ({
  crossSpawn: crossSpawnMock,
}));

let TmuxMultiplexer: typeof import('./index').TmuxMultiplexer;

beforeEach(async () => {
  const mod = await import('./index');
  TmuxMultiplexer = mod.TmuxMultiplexer;
});

function createSpawnResult(
  exitCode = 0,
  stdout = '',
  stderr = '',
): SpawnResult {
  return {
    exited: Promise.resolve(exitCode),
    stdout: () => Promise.resolve(stdout),
    stderr: () => Promise.resolve(stderr),
    kill: () => true,
    exitCode,
    proc: {} as never,
  };
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function commands(): string[][] {
  return crossSpawnMock.mock.calls.map((call) => call[0] as string[]);
}

describe('TmuxMultiplexer', () => {
  const originalTmux = process.env.TMUX;
  const originalTmuxPane = process.env.TMUX_PANE;

  beforeEach(() => {
    process.env.TMUX = '/tmp/tmux-test/default,1,0';
    process.env.TMUX_PANE = '%1';

    logMock.mockClear();
    crossSpawnMock.mockReset();
    crossSpawnMock.mockImplementation((command: string[]) => {
      if (command[0] === 'which')
        return createSpawnResult(0, '/usr/bin/tmux\n');
      if (command[1] === '-V') return createSpawnResult(0, 'tmux 3.6a');
      if (command[1] === 'split-window') {
        return createSpawnResult(0, '%2\n');
      }
      return createSpawnResult();
    });
  });

  afterEach(() => {
    process.env.TMUX = originalTmux;
    process.env.TMUX_PANE = originalTmuxPane;
  });

  test('coalesces layout application after bursty pane spawns', async () => {
    const tmux = new TmuxMultiplexer('main-vertical', 60);

    await tmux.spawnPane(
      'session-1',
      'First worker',
      'http://localhost:4096',
      '/repo',
    );
    await tmux.spawnPane(
      'session-2',
      'Second worker',
      'http://localhost:4096',
      '/repo',
    );
