export interface DelegateTaskErrorPattern {
  pattern: string;
  errorType: string;
  fixHints: string[];
}

export const DELEGATE_TASK_ERROR_PATTERNS: DelegateTaskErrorPattern[] = [
  {
    pattern: 'run_in_background',
    errorType: 'missing_run_in_background',
    fixHints: [
      'Add run_in_background=true or run_in_background=false',
    ],
  },
  {
    pattern: 'load_skills',
    errorType: 'missing_load_skills',
    fixHints: [
      'Add load_skills=[] (must be an array)',
    ],
  },
  {
    pattern: 'category OR subagent_type',
    errorType: 'mutual_exclusion',
    fixHints: [
      'Use EITHER category OR subagent_type, not both',
      'Example: category="unspecified-low"',
    ],
  },
  {
    pattern: 'Must provide either category or subagent_type',
    errorType: 'missing_category_or_agent',
    fixHints: [
      'Add category="unspecified-low" or subagent_type="explorer"',
    ],
  },
  {
    pattern: 'Unknown category',
    errorType: 'unknown_category',
    fixHints: [
      'Use a valid category from the list below',
    ],
  },
  {
    pattern: 'Unknown agent',
    errorType: 'unknown_agent',
    fixHints: [
      'Use a valid agent name from the list below',
    ],
  },
  {
    pattern: 'Skills not found',
    errorType: 'unknown_skills',
    fixHints: [
      'Use valid skill names from the list below',
    ],
  },
  {
    pattern: 'is not allowed. Allowed agents:',
    errorType: 'background_agent_not_allowed',
    fixHints: [
      'Use one of the allowed agents shown below',
      'Or call from a parent agent that can use this agent',
    ],
  },
];

export interface DetectedError {
  errorType: string;
  originalOutput: string;
}

export function detectDelegateTaskError(output: string): DetectedError | null {
  if (!output || typeof output !== 'string') return null;

  const hasErrorSignal =
    output.includes('[ERROR]') ||
    output.includes('Invalid arguments') ||
    output.includes('is not allowed. Allowed agents:');

  if (!hasErrorSignal) return null;

  for (const pattern of DELEGATE_TASK_ERROR_PATTERNS) {
    if (output.includes(pattern.pattern)) {
      return {
        errorType: pattern.errorType,
        originalOutput: output,
      };
    }
  }

  return null;
}
