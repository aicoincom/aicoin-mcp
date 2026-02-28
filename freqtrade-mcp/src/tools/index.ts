/**
 * Tool registry — registers all Freqtrade MCP tools
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBotControlTools } from './bot-control.js';
import { registerTradingTools } from './trading.js';
import { registerPerformanceTools } from './performance.js';
import { registerBacktestingTools } from './backtesting.js';
import { registerStrategyTools } from './strategy.js';
import { registerDataTools } from './data.js';

export function registerAllTools(server: McpServer) {
  registerBotControlTools(server);
  registerTradingTools(server);
  registerPerformanceTools(server);
  registerBacktestingTools(server);
  registerStrategyTools(server);
  registerDataTools(server);
}
