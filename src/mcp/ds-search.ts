import type { RemoteMcpConfig } from './types';

/**
 * Internal code search MCP for on-premise deployment.
 * Configure via DS_SEARCH_URL and DS_SEARCH_API_KEY environment variables.
 */
export const dsSearch: RemoteMcpConfig = {
  type: 'remote',
  url: process.env.DS_SEARCH_URL ?? 'http://localhost:8080/mcp',
  headers: process.env.DS_SEARCH_API_KEY
    ? { Authorization: `Bearer ${process.env.DS_SEARCH_API_KEY}` }
    : undefined,
  oauth: false,
};
