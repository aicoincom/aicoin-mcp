/**
 * Tool registry - registers all MCP tools
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPublicTools } from './public.js';
import { registerPrivateTools } from './private.js';

export function registerAllTools(server: McpServer) {
  registerPublicTools(server);
  registerPrivateTools(server);
}
