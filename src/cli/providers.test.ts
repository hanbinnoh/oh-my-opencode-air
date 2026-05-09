/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { generateLiteConfig } from './providers';

describe('generateLiteConfig', () => {
  test('generates config with all 5 agents', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      installCustomSkills: false,
      reset: false,
    });

    expect(config.$schema).toBe(
      'https://unpkg.com/oh-my-opencode-air@latest/oh-my-opencode-air.schema.json',
    );
    expect(config.disabled_agents).toEqual([]);
    expect(config.agents).toBeDefined();
    expect(Object.keys(config.agents as Record<string, unknown>)).toEqual([
      'orchestrator',
      'oracle',
      'explorer',
      'librarian',
      'fixer',
    ]);
  });

  test('uses correct on-prem model IDs', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      installCustomSkills: false,
      reset: false,
    });

    const agents = config.agents as Record<string, { model: string }>;
    expect(agents.orchestrator.model).toBe('codemate/DSllmOCoder');
    expect(agents.oracle.model).toBe('codemate/DSllmOCoder');
    expect(agents.explorer.model).toBe('codemate/DSllmOCoderStable');
    expect(agents.librarian.model).toBe('codemate/DSllmOCoderStable');
    expect(agents.fixer.model).toBe('codemate/DSllmOCoderStable');
  });

  test('includes skills for agents', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: true,
      installCustomSkills: false,
      reset: false,
    });

    const agents = config.agents as Record<string, { skills: string[] }>;
    expect(agents.orchestrator.skills).toEqual(['*']);
    expect(agents.oracle.skills).toContain('simplify');
  });

  test('includes mcps field for all agents', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      installCustomSkills: false,
      reset: false,
    });

    const agents = config.agents as Record<string, { mcps: unknown }>;
    expect(agents.orchestrator.mcps).toBeDefined();
    expect(Array.isArray(agents.orchestrator.mcps)).toBe(true);
    expect(agents.librarian.mcps).toContain('websearch');
    expect(agents.librarian.mcps).toContain('grep_app');
    expect(agents.librarian.mcps).toContain('ds_search');
  });

  test('enables tmux when requested', () => {
    const config = generateLiteConfig({
      hasTmux: true,
      installSkills: false,
      installCustomSkills: false,
      reset: false,
    });

    expect(config.tmux).toBeDefined();
    expect((config.tmux as any).enabled).toBe(true);
    expect((config.tmux as any).layout).toBe('main-vertical');
  });
});
