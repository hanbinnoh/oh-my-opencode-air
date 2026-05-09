import { DEFAULT_AGENT_MCPS } from '../config/agent-mcps';
import { CUSTOM_SKILLS } from './custom-skills';
import { RECOMMENDED_SKILLS } from './skills';
import type { InstallConfig } from './types';

const SCHEMA_URL =
  'https://unpkg.com/oh-my-opencode-air@latest/oh-my-opencode-air.schema.json';

// On-premise model configuration — single provider with two models.
const ONPREM_MODELS: Record<string, { model: string; variant?: string }> = {
  orchestrator: { model: 'codemate/DSllmOCoder', variant: 'low' },
  oracle: { model: 'codemate/DSllmOCoder', variant: 'high' },
  explorer: { model: 'codemate/DSllmOCoderStable', variant: 'low' },
  librarian: { model: 'codemate/DSllmOCoderStable', variant: 'low' },
  fixer: { model: 'codemate/DSllmOCoderStable', variant: 'low' },
};

export function generateLiteConfig(
  installConfig: InstallConfig,
): Record<string, unknown> {
  const createAgentConfig = (agentName: string) => {
    const modelInfo = ONPREM_MODELS[agentName];
    const isOrchestrator = agentName === 'orchestrator';

    const skills = isOrchestrator
      ? ['*']
      : [
          ...RECOMMENDED_SKILLS.filter(
            (s) =>
              s.allowedAgents.includes('*') ||
              s.allowedAgents.includes(agentName),
          ).map((s) => s.skillName),
          ...CUSTOM_SKILLS.filter(
            (s) =>
              s.allowedAgents.includes('*') ||
              s.allowedAgents.includes(agentName),
          ).map((s) => s.name),
        ];

    return {
      model: modelInfo.model,
      variant: modelInfo.variant,
      skills,
      mcps:
        DEFAULT_AGENT_MCPS[agentName as keyof typeof DEFAULT_AGENT_MCPS] ?? [],
    };
  };

  const agents = Object.fromEntries(
    Object.keys(ONPREM_MODELS).map((agentName) => [
      agentName,
      createAgentConfig(agentName),
    ]),
  );

  const config: Record<string, unknown> = {
    $schema: SCHEMA_URL,
    agents,
    disabled_agents: [],
  };

  if (installConfig.hasTmux) {
    config.tmux = {
      enabled: true,
      layout: 'main-vertical',
      main_pane_size: 60,
    };
  }

  return config;
}
