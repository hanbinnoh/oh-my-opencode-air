import { describe, expect, test } from 'bun:test';
import { createWriteConstraintHook } from './index';

describe('createWriteConstraintHook', () => {
  const hook = createWriteConstraintHook();

  type BeforeHandler = NonNullable<
    ReturnType<typeof createWriteConstraintHook>['tool.execute.before']
  >;
  type BeforeInput = Parameters<BeforeHandler>[0];
  type BeforeOutput = Parameters<BeforeHandler>[1];

  const createInput = (tool: string): BeforeInput => ({
    tool,
    sessionID: 'test-session',
    callID: 'test-call-id',
  });

  const createOutput = (args?: Record<string, unknown>): BeforeOutput => ({
    args: args as BeforeOutput['args'],
  });

  const generateLines = (n: number): string =>
    Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n');

  describe('edit tool (newString)', () => {
    test('allows newString under 100 lines', async () => {
      const output = createOutput({ newString: generateLines(50) });
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).resolves.toBeUndefined();
    });

    test('allows newString exactly 100 lines', async () => {
      const output = createOutput({ newString: generateLines(100) });
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).resolves.toBeUndefined();
    });

    test('rejects newString over 100 lines', async () => {
      const output = createOutput({ newString: generateLines(101) });
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).rejects.toThrow(/101 lines exceeds 100-line limit/);
    });

    test('rejects large newString with descriptive message', async () => {
      const output = createOutput({ newString: generateLines(250) });
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).rejects.toThrow(/250 lines exceeds 100-line limit/);
    });
  });

  describe('write tool (content)', () => {
    test('allows content under 100 lines', async () => {
      const output = createOutput({ content: generateLines(80) });
      await expect(
        hook['tool.execute.before'](createInput('write'), output),
      ).resolves.toBeUndefined();
    });

    test('allows content exactly 100 lines', async () => {
      const output = createOutput({ content: generateLines(100) });
      await expect(
        hook['tool.execute.before'](createInput('write'), output),
      ).resolves.toBeUndefined();
    });

    test('rejects content over 100 lines', async () => {
      const output = createOutput({ content: generateLines(150) });
      await expect(
        hook['tool.execute.before'](createInput('write'), output),
      ).rejects.toThrow(/150 lines exceeds 100-line limit/);
    });
  });

  describe('case-insensitive tool names', () => {
    test('works with Edit (capitalized)', async () => {
      const output = createOutput({ newString: generateLines(200) });
      await expect(
        hook['tool.execute.before'](createInput('Edit'), output),
      ).rejects.toThrow(/200 lines exceeds 100-line limit/);
    });

    test('works with Write (capitalized)', async () => {
      const output = createOutput({ content: generateLines(200) });
      await expect(
        hook['tool.execute.before'](createInput('Write'), output),
      ).rejects.toThrow(/200 lines exceeds 100-line limit/);
    });
  });

  describe('non-write tools', () => {
    test('ignores Read tool', async () => {
      const output = createOutput({ content: generateLines(500) });
      await expect(
        hook['tool.execute.before'](createInput('Read'), output),
      ).resolves.toBeUndefined();
    });

    test('ignores Bash tool', async () => {
      const output = createOutput({ content: generateLines(500) });
      await expect(
        hook['tool.execute.before'](createInput('Bash'), output),
      ).resolves.toBeUndefined();
    });

    test('ignores unknown tool names', async () => {
      const output = createOutput({ content: generateLines(500) });
      await expect(
        hook['tool.execute.before'](createInput('SomeOtherTool'), output),
      ).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    test('does nothing when args is undefined', async () => {
      const output = createOutput(undefined);
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).resolves.toBeUndefined();
    });

    test('does nothing when content/newString is undefined', async () => {
      const output = createOutput({ oldString: 'some text' });
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).resolves.toBeUndefined();
    });

    test('does nothing when content/newString is empty string', async () => {
      const output = createOutput({ newString: '' });
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).resolves.toBeUndefined();
    });

    test('handles single-line content', async () => {
      const output = createOutput({ newString: 'single line' });
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).resolves.toBeUndefined();
    });

    test('error message mentions chunking guidance', async () => {
      const output = createOutput({ newString: generateLines(150) });
      await expect(
        hook['tool.execute.before'](createInput('edit'), output),
      ).rejects.toThrow(/Split into multiple tool calls/);
    });
  });
});
