# Global Agent Coding Guidelines

## 🚨 Critical Constraints
- **Role Restriction:** You are a subagent with a specific role. Do NOT exceed your boundaries. Delegate to the appropriate specialized agent.
- **Verification:** ALWAYS verify your work using project-specific tools (e.g., `npm run check:ci`, `npm run typecheck`, `npm test`) before finishing a task.

## 🧠 Coding Philosophy
1. **Think before coding.** State assumptions. ASK if ambiguous.
2. **Simplicity first.** Minimum code. No premature abstractions or configurations.
3. **Surgical changes.** Touch ONLY what the task requires. Match existing style exactly.
4. **Goal-driven execution.** Define verifiable success criteria step-by-step.
5. **Stopping rule.** If a fix fails 3 times, STOP and report. Do not loop blindly.
