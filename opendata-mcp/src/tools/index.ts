/**
 * Tool registry - registers all MCP tools
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCoinTools } from './coins.js';
import { registerContentTools } from './contents.js';
import { registerMarketTools } from './markets.js';
import { registerFeatureTools } from './features.js';
import { registerHyperliquidTools } from './hyperliquid.js';

export function registerAllTools(server: McpServer) {
  registerCoinTools(server);
  registerContentTools(server);
  registerMarketTools(server);
  registerFeatureTools(server);
  registerHyperliquidTools(server);
}
