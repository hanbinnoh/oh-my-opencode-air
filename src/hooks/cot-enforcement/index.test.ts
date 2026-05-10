import { describe, expect, test } from 'bun:test';
import { COT_ENFORCEMENT_TEXT, createCoTEnforcementHook } from './index';

describe('createCoTEnforcementHook', () => {
  test('injects CoT instruction for orchestrator', async () => {
    const map = new Map([['session-1', 'orchestrator']]);
    const hook = createCoTEnforcementHook({
      getAgentForSession: (id) => map.get(id),
    });

    const output = { system: ['base prompt'] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 'session-1' },
      output,
    );

    expect(output.system).toHaveLength(2);
    expect(output.system[0]).toBe('base prompt');
    expect(output.system[1]).toBe(COT_ENFORCEMENT_TEXT);
  });

  test('injects CoT instruction for oracle', async () => {
    const map = new Map([['session-2', 'oracle']]);
    const hook = createCoTEnforcementHook({
      getAgentForSession: (id) => map.get(id),
    });

    const output = { system: ['base prompt'] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 'session-2' },
      output,
    );

    expect(output.system).toHaveLength(2);
    expect(output.system[1]).toBe(COT_ENFORCEMENT_TEXT);
  });

  test('skips non-target agents', async () => {
    const map = new Map([['session-3', 'fixer']]);
    const hook = createCoTEnforcementHook({
      getAgentForSession: (id) => map.get(id),
    });

    const output = { system: ['base prompt'] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 'session-3' },
      output,
    );

    expect(output.system).toHaveLength(1);
    expect(output.system[0]).toBe('base prompt');
  });

  test('skips when sessionID is missing', async () => {
    const hook = createCoTEnforcementHook({
      getAgentForSession: () => 'orchestrator',
    });

    const output = { system: ['base prompt'] };
    await hook['experimental.chat.system.transform']({}, output);

    expect(output.system).toHaveLength(1);
  });

  test('skips when agent is unknown', async () => {
    const hook = createCoTEnforcementHook({
      getAgentForSession: () => undefined,
    });

    const output = { system: ['base prompt'] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 'session-4' },
      output,
    );

    expect(output.system).toHaveLength(1);
  });

  test('does not duplicate injection', async () => {
    const map = new Map([['session-5', 'orchestrator']]);
    const hook = createCoTEnforcementHook({
      getAgentForSession: (id) => map.get(id),
    });

    const output = { system: ['base prompt', COT_ENFORCEMENT_TEXT] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 'session-5' },
      output,
    );

    expect(output.system).toHaveLength(2);
  });

  test('respects custom targetAgents', async () => {
    const map = new Map([['session-6', 'fixer']]);
    const hook = createCoTEnforcementHook({
      getAgentForSession: (id) => map.get(id),
      targetAgents: ['fixer'],
    });

    const output = { system: ['base prompt'] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 'session-6' },
      output,
    );

    expect(output.system).toHaveLength(2);
    expect(output.system[1]).toBe(COT_ENFORCEMENT_TEXT);
  });
});
