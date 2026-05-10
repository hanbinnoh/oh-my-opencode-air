import type { DetectedToolError } from './patterns';
import type { FailureRecord } from './tracker';

const RESILIENCE_MARKER = '[TOOL CALLING RESILIENCE]';
const LOOP_MARKER = '[RETRY LOOP DETECTED]';

export function buildResilienceGuidance(
  error: DetectedToolError,
  record: FailureRecord,
  isLoop: boolean,
): string {
  const lines: string[] = [''];

  if (isLoop) {
    lines.push(
      `${LOOP_MARKER}`,
      `You have attempted this same operation ${record.count} times in the last minute and it keeps failing with the same error.`,
      `STOP retrying the exact same approach. Instead:`,
      `  1. Re-read the error message carefully — the root cause may be different from what you assume.`,
      `  2. Try a completely different strategy (e.g., use a different tool, check prerequisites first).`,
      `  3. If stuck, ask the user for guidance rather than repeating the failed call.`,
    );
  } else {
    lines.push(
      `${RESILIENCE_MARKER}`,
      `Error type: ${error.patternId}`,
      `Category: ${error.category}`,
      `Retryable: ${error.retryable ? 'yes' : 'no'}`,
      ``,
      `Fix: ${error.fixHint}`,
    );

    if (record.count > 1) {
      lines.push(
        ``,
        `Note: This is attempt ${record.count} for this error pattern. If it fails again, consider a different approach.`,
      );
    }

    if (error.retryable) {
      lines.push(
        ``,
        `Retry now with the corrected parameters. If the error persists after ${3 - record.count > 0 ? 3 - record.count : 0} more attempts, try a different approach.`,
      );
    } else {
      lines.push(
        ``,
        `This error is not retryable — fix the underlying issue before trying again.`,
      );
    }
  }

  return lines.join('\n');
}
