export const COT_ENFORCEMENT_TEXT = `<chain_of_thought_enforcement>
Before responding, you MUST think step by step inside <thinking>...</thinking> tags:
1. Understand the request and identify constraints.
2. Break down the problem into sub-steps.
3. Consider alternatives and edge cases.
4. Formulate your plan or answer.
5. Verify it satisfies all requirements.

Your final response must come after the closing </thinking> tag.
</chain_of_thought_enforcement>`;

export interface CoTEnforcementOptions {
  getAgentForSession: (sessionID: string) => string | undefined;
  targetAgents?: string[];
}

export interface CoTEnforcementHook {
  'experimental.chat.system.transform': (
    input: { sessionID?: string },
    output: { system: string[] },
  ) => Promise<void>;
}

export function createCoTEnforcementHook(
  options: CoTEnforcementOptions,
): CoTEnforcementHook {
  const targetAgents = new Set(
    options.targetAgents ?? ['orchestrator', 'oracle'],
  );

  return {
    'experimental.chat.system.transform': async (input, output) => {
      if (!input.sessionID) {
        return;
      }

      const agent = options.getAgentForSession(input.sessionID);
      if (!agent || !targetAgents.has(agent)) {
        return;
      }

      const alreadyInjected = output.system.some(
        (s) =>
          typeof s === 'string' && s.includes('<chain_of_thought_enforcement>'),
      );
      if (alreadyInjected) {
        return;
      }

      output.system.push(COT_ENFORCEMENT_TEXT);
    },
  };
}
