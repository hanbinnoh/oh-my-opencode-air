import { describe, expect, test } from 'bun:test';
import { createContextBudgetHook } from './index';

describe('createContextBudgetHook', () => {
  test('does not trim when under budget', async () => {
    const hook = createContextBudgetHook({ enabled: true });
    const messages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'hello' }] },
    ];
    hook.recordModel({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 's1',
          providerID: 'onprem',
          modelID: 'minimax-2.5',
        },
      },
    });
    await hook['experimental.chat.messages.transform'](
      { sessionID: 's1' },
      { messages },
    );
    expect(messages.length).toBe(1);
  });

  test('trims when over budget', async () => {
    const hook = createContextBudgetHook({ enabled: true });
    const messages = Array.from({ length: 200 }, (_, i) => ({
      info: { role: i % 2 === 0 ? 'user' : 'assistant' },
      parts: [{ type: 'text', text: 'a'.repeat(4000) }],
    }));
    hook.recordModel({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 's2',
          providerID: 'onprem',
          modelID: 'minimax-2.5',
        },
      },
    });
    await hook['experimental.chat.messages.transform'](
      { sessionID: 's2' },
      { messages },
    );
    expect(messages.length).toBeLessThan(200);
  });

  test('does nothing without sessionID', async () => {
    const hook = createContextBudgetHook({ enabled: true });
    const messages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'hello' }] },
    ];
    await hook['experimental.chat.messages.transform']({}, { messages });
    expect(messages.length).toBe(1);
  });

  test('does nothing when model not recorded', async () => {
    const hook = createContextBudgetHook({ enabled: true });
    const messages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'hello' }] },
    ];
    await hook['experimental.chat.messages.transform'](
      { sessionID: 's3' },
      { messages },
    );
    expect(messages.length).toBe(1);
  });

  test('disabled hook does nothing', async () => {
    const hook = createContextBudgetHook({ enabled: false });
    const messages = Array.from({ length: 200 }, (_, i) => ({
      info: { role: i % 2 === 0 ? 'user' : 'assistant' },
      parts: [{ type: 'text', text: 'a'.repeat(4000) }],
    }));
    hook.recordModel({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 's4',
          providerID: 'onprem',
          modelID: 'minimax-2.5',
        },
      },
    });
    await hook['experimental.chat.messages.transform'](
      { sessionID: 's4' },
      { messages },
    );
    expect(messages.length).toBe(200);
  });

  test('clears session on request', async () => {
    const hook = createContextBudgetHook({ enabled: true });
    hook.recordModel({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 's5',
          providerID: 'onprem',
          modelID: 'minimax-2.5',
        },
      },
    });
    hook.clearSession('s5');
    const messages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'hello' }] },
    ];
    await hook['experimental.chat.messages.transform'](
      { sessionID: 's5' },
      { messages },
    );
    expect(messages.length).toBe(1);
  });

  test('ignores non-message.updated events', () => {
    const hook = createContextBudgetHook({ enabled: true });
    expect(() =>
      hook.recordModel({
        type: 'session.created',
        properties: {
          info: {
            sessionID: 's6',
            providerID: 'onprem',
            modelID: 'minimax-2.5',
          },
        },
      }),
    ).not.toThrow();
  });
});
