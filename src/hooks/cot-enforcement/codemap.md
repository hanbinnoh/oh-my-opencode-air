# src/hooks/cot-enforcement/

Chain-of-Thought enforcement for on-premise models.

## Responsibility

- Inject explicit step-by-step reasoning instructions into the system prompt.
- Target agents that benefit most from structured reasoning (orchestrator, oracle).
- Prevent duplicate injection across turns.

## Design

- Uses `experimental.chat.system.transform` to append the instruction to the system prompt array.
- Only activates for agents listed in `targetAgents` (default: orchestrator, oracle).
- Relies on `getAgentForSession` to resolve the agent name from the session ID.
