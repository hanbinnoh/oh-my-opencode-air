import { beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import * as fs from 'node:fs';

mock.module('../../utils/logger', () => ({
  log: mock(() => {}),
}));

mock.module('../../cli/config-manager', () => ({
  stripJsonComments: (s: string) => s,
  getOpenCodeConfigPaths: () => [
    '/mock/config/opencode.json',
    '/mock/config/opencode.jsonc',
  ],
}));

let extractChannel: typeof import('./checker').extractChannel;
let getLocalDevVersion: typeof import('./checker').getLocalDevVersion;
let findPluginEntry: typeof import('./checker').findPluginEntry;

beforeEach(async () => {
  const mod = await import('./checker');
  extractChannel = mod.extractChannel;
  getLocalDevVersion = mod.getLocalDevVersion;
  findPluginEntry = mod.findPluginEntry;
});

describe('auto-update-checker/checker', () => {
  describe('extractChannel', () => {
    test('returns latest for null or empty', () => {
      expect(extractChannel(null)).toBe('latest');
      expect(extractChannel('')).toBe('latest');
    });

    test('returns tag if version starts with non-digit', () => {
      expect(extractChannel('beta')).toBe('beta');
      expect(extractChannel('next')).toBe('next');
    });

    test('extracts channel from prerelease version', () => {
      expect(extractChannel('1.0.0-alpha.1')).toBe('alpha');
      expect(extractChannel('2.3.4-beta.5')).toBe('beta');
      expect(extractChannel('0.1.0-rc.1')).toBe('rc');
      expect(extractChannel('1.0.0-canary.0')).toBe('canary');
    });

    test('returns latest for standard versions', () => {
      expect(extractChannel('1.0.0')).toBe('latest');
    });
  });

  describe('getLocalDevVersion', () => {
    test('returns null if no local dev path in config', () => {
      const existsSpy = spyOn(fs, 'existsSync').mockReturnValue(false);

      expect(getLocalDevVersion('/test')).toBeNull();

      existsSpy.mockRestore();
    });

    test('returns version from local package.json if path exists', () => {
      const existsSpy = spyOn(fs, 'existsSync').mockImplementation(
        (p: string) => {
          if (p.includes('opencode.json')) return true;
          if (p.includes('package.json')) return true;
          return false;
        },
      );
      const statSpy = spyOn(fs, 'statSync').mockImplementation(
        () =>
          ({
            isDirectory: () => true,
          }) as unknown as fs.Stats,
      );
      const readSpy = spyOn(fs, 'readFileSync').mockImplementation(
        (p: string) => {
          if (p.includes('opencode.json')) {
            return JSON.stringify({
              plugin: ['file:///dev/oh-my-opencode-air'],
            });
          }
          if (p.includes('package.json')) {
            return JSON.stringify({
              name: 'oh-my-opencode-air',
              version: '1.2.3-dev',
            });
          }
          return '';
        },
      );

      expect(getLocalDevVersion('/test')).toBe('1.2.3-dev');

      existsSpy.mockRestore();
      statSpy.mockRestore();
      readSpy.mockRestore();
    });
  });

  describe('findPluginEntry', () => {
    test('detects latest version entry', () => {
      const existsSpy = spyOn(fs, 'existsSync').mockImplementation(
        (p: string) => p.includes('opencode.json'),
      );
      const readSpy = spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify({
          plugin: ['oh-my-opencode-air'],
        }),
      );

      const entry = findPluginEntry('/test');
      expect(entry).not.toBeNull();
      expect(entry?.entry).toBe('oh-my-opencode-air');
      expect(entry?.isPinned).toBe(false);
      expect(entry?.pinnedVersion).toBeNull();

      existsSpy.mockRestore();
      readSpy.mockRestore();
    });

    test('detects pinned version entry', () => {
      const existsSpy = spyOn(fs, 'existsSync').mockImplementation(
        (p: string) => p.includes('opencode.json'),
      );
      const readSpy = spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify({
          plugin: ['oh-my-opencode-air@1.0.0'],
        }),
      );

      const entry = findPluginEntry('/test');
      expect(entry).not.toBeNull();
      expect(entry?.isPinned).toBe(true);
      expect(entry?.pinnedVersion).toBe('1.0.0');

      existsSpy.mockRestore();
      readSpy.mockRestore();
    });
  });
});
