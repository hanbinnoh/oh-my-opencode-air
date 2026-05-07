import { describe, expect, test } from 'bun:test';
import { createBuiltinMcps } from './index';

describe('createBuiltinMcps', () => {
  test('returns all MCPs when no disabled list provided', () => {
    const mcps = createBuiltinMcps();
    const names = Object.keys(mcps);

    expect(names).toContain('websearch');
    expect(names).toContain('context7');
    expect(names).toContain('grep_app');
    expect(names).toContain('ds_search');
  });

  test('returns all MCPs with empty disabled list', () => {
    const mcps = createBuiltinMcps([]);
    const names = Object.keys(mcps);

    expect(names.length).toBe(4);
    expect(names).toContain('websearch');
    expect(names).toContain('context7');
    expect(names).toContain('grep_app');
    expect(names).toContain('ds_search');
  });

  test('excludes single disabled MCP', () => {
    const mcps = createBuiltinMcps(['websearch']);
    const names = Object.keys(mcps);

    expect(names).not.toContain('websearch');
    expect(names).toContain('context7');
    expect(names).toContain('grep_app');
    expect(names).toContain('ds_search');
  });

  test('excludes multiple disabled MCPs', () => {
    const mcps = createBuiltinMcps(['websearch', 'grep_app']);
    const names = Object.keys(mcps);

    expect(names).not.toContain('websearch');
    expect(names).not.toContain('grep_app');
    expect(names).toContain('context7');
    expect(names).toContain('ds_search');
    expect(names.length).toBe(2);
  });

  test('excludes all MCPs when all disabled', () => {
    const mcps = createBuiltinMcps([
      'websearch',
      'context7',
      'grep_app',
      'ds_search',
    ]);
    const names = Object.keys(mcps);

    expect(names.length).toBe(0);
  });

  test('ignores unknown MCP names in disabled list', () => {
    const mcps = createBuiltinMcps(['unknown_mcp', 'nonexistent']);
    const names = Object.keys(mcps);

    // All valid MCPs should still be present
    expect(names.length).toBe(4);
    expect(names).toContain('websearch');
    expect(names).toContain('context7');
    expect(names).toContain('grep_app');
    expect(names).toContain('ds_search');
  });

  test('MCP configs have required properties', () => {
    const mcps = createBuiltinMcps();

    for (const [_name, config] of Object.entries(mcps)) {
      expect(config).toBeDefined();
      // Each MCP should have either url (remote) or command (local)
      const hasUrl = 'url' in config;
      const hasCommand = 'command' in config;
      expect(hasUrl || hasCommand).toBe(true);
    }
  });

  test('websearch MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const websearch = mcps.websearch;

    expect(websearch).toBeDefined();
    expect('url' in websearch).toBe(true);
  });

  test('context7 MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const context7 = mcps.context7;

    expect(context7).toBeDefined();
    expect('url' in context7).toBe(true);
  });

  test('grep_app MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const grep_app = mcps.grep_app;

    expect(grep_app).toBeDefined();
    expect('url' in grep_app).toBe(true);
  });

  test('ds_search MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const ds_search = mcps.ds_search;

    expect(ds_search).toBeDefined();
    expect('url' in ds_search).toBe(true);
    expect(ds_search).toHaveProperty('type', 'remote');
  });
});
