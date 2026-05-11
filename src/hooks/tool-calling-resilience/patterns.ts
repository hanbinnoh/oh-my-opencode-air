export interface ToolErrorPattern {
  id: string;
  category: string;
  patterns: RegExp[];
  retryable: boolean;
  fixHint: string;
}

export interface DetectedToolError {
  patternId: string;
  category: string;
  retryable: boolean;
  fixHint: string;
  originalOutput: string;
}

export const TOOL_ERROR_PATTERNS: ToolErrorPattern[] = [
  {
    id: 'file_not_found',
    category: 'filesystem',
    patterns: [
      /\bENOENT\b/,
      /\bno such file or directory\b/i,
      /\bfile not found\b/i,
      /\bcannot find\b/i,
      /\bdoes not exist\b/i,
      /\bpath does not exist\b/i,
      /\bnot found: /i,
    ],
    retryable: true,
    fixHint:
      'Path not found. RUN glob or grep FIRST.',
  },
  {
    id: 'permission_denied',
    category: 'filesystem',
    patterns: [
      /\bEACCES\b/,
      /\bpermission denied\b/i,
      /\baccess denied\b/i,
      /\bnot permitted\b/i,
      /\bunauthorized\b/i,
      /\bforbidden\b/i,
    ],
    retryable: true,
    fixHint:
      'Permission denied. RUN ls -l to check file mode.',
  },
  {
    id: 'network_timeout',
    category: 'network',
    patterns: [
      /\bETIMEDOUT\b/,
      /\btimed out\b/i,
      /\btimeout\b/i,
      /\bconnection timed out\b/i,
      /\brequest timeout\b/i,
      /\bgateway timeout\b/i,
    ],
    retryable: true,
    fixHint:
      'Timed out. Wait then retry.',
  },
  {
    id: 'network_connection',
    category: 'network',
    patterns: [
      /\bECONNREFUSED\b/,
      /\bECONNRESET\b/,
      /\bconnection refused\b/i,
      /\bconnection reset\b/i,
      /\bunable to connect\b/i,
      /\bnetwork error\b/i,
      /\bdns lookup failed\b/i,
      /\bgetaddrinfo\b/i,
    ],
    retryable: true,
    fixHint:
      'Connection refused. Verify URL is reachable.',
  },
  {
    id: 'network_http_error',
    category: 'network',
    patterns: [
      /\b5\d{2}\b/,
      /\bserver error\b/i,
      /\binternal error\b/i,
      /\bbad gateway\b/i,
      /\bservice unavailable\b/i,
    ],
    retryable: true,
    fixHint:
      'Server error (5xx). Retry later.',
  },
  {
    id: 'invalid_arguments',
    category: 'validation',
    patterns: [
      /\binvalid arguments?\b/i,
      /\bmissing required\b/i,
      /\brequired argument\b/i,
      /\bexpected .* but got\b/i,
      /\btype error\b/i,
      /\bcannot read properties of undefined\b/i,
      /\bis not a function\b/i,
      /\bvalidation failed\b/i,
      /\bargument .* is required\b/i,
    ],
    retryable: true,
    fixHint:
      'Invalid args. Check tool schema for required fields and types.',
  },
  {
    id: 'tool_not_found',
    category: 'system',
    patterns: [
      /\bcommand not found\b/i,
      /\bis not recognized\b/i,
      /\bunknown command\b/i,
      /\btool not found\b/i,
      /\bspawn .* ENOENT\b/i,
    ],
    retryable: false,
    fixHint:
      'Tool not in PATH. Install it or use alternative.',
  },
  {
    id: 'rate_limit',
    category: 'rate_limit',
    patterns: [
      /\b429\b/,
      /\brate.?limit/i,
      /\btoo many requests\b/i,
      /\bquota exceeded\b/i,
      /\bthrottled\b/i,
    ],
    retryable: true,
    fixHint:
      'Rate limited. Wait then retry.',
  },
  {
    id: 'disk_full',
    category: 'filesystem',
    patterns: [
      /\bENOSPC\b/,
      /\bno space left\b/i,
      /\bdisk full\b/i,
      /\bquota exceeded\b/i,
    ],
    retryable: false,
    fixHint:
      'Disk full. Free space with rm/cleanup.',
  },
  {
    id: 'parse_error',
    category: 'data',
    patterns: [
      /\bparse error\b/i,
      /\bunexpected token\b/i,
      /\bsyntax error\b/i,
      /\bmalformed\b/i,
      /\bunparsable\b/i,
    ],
    retryable: true,
    fixHint:
      'Parse error. Validate data format (JSON/XML).',
  },
];

export const EXCLUDED_TOOLS_WITH_OWN_HOOKS = new Set<string>([
  'task',
  'bash',
  'webfetch',
  'grep_app_searchgithub',
  'websearch_web_search_exa',
]);

const SILENT_ERROR_PATTERN_IDS = new Set([
  'network_timeout',
  'network_connection',
  'file_not_found',
]);

function hasExplicitErrorSignal(output: string): boolean {
  return (
    output.includes('[ERROR]') ||
    output.includes('Error:') ||
    output.includes('error:') ||
    /^\s*error\b/i.test(output)
  );
}

function findMatchingPattern(output: string): ToolErrorPattern | null {
  for (const pattern of TOOL_ERROR_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(output)) {
        return pattern;
      }
    }
  }
  return null;
}

export function detectToolError(output: string): DetectedToolError | null {
  if (!output || typeof output !== 'string') return null;

  const explicitError = hasExplicitErrorSignal(output);

  if (!explicitError) {
    const silentMatch = findMatchingPattern(output);
    if (silentMatch && SILENT_ERROR_PATTERN_IDS.has(silentMatch.id)) {
      return {
        patternId: silentMatch.id,
        category: silentMatch.category,
        retryable: silentMatch.retryable,
        fixHint: silentMatch.fixHint,
        originalOutput: output,
      };
    }
    return null;
  }

  const matched = findMatchingPattern(output);
  if (matched) {
    return {
      patternId: matched.id,
      category: matched.category,
      retryable: matched.retryable,
      fixHint: matched.fixHint,
      originalOutput: output,
    };
  }

  return {
    patternId: 'generic_error',
    category: 'unknown',
    retryable: true,
    fixHint:
      'The tool failed with an unrecognized error. Read the error message carefully and address the root cause before retrying.',
    originalOutput: output,
  };
}
