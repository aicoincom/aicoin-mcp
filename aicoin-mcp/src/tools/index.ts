/**
 * Tool registry - registers all MCP tools
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTradeTools } from './trade.js';
import { registerCoinTools } from './coins.js';
import { registerContentTools } from './contents.js';
import { registerMarketTools } from './markets.js';
import { registerFeatureTools } from './features.js';
import { registerHyperliquidTools } from './hyperliquid.js';
import { registerGuideTools } from './guide.js';
import { registerFreqtradeTools } from './freqtrade.js';
import { registerFreqtradeDevTools } from './freqtrade-dev.js';
import { registerFtDeployTools } from './ft-deploy.js';
import { registerAutoTradeTools } from './auto-trade.js';

export function registerAllTools(server: McpServer) {
  registerTradeTools(server);
  registerCoinTools(server);
  registerContentTools(server);
  registerMarketTools(server);
  registerFeatureTools(server);
  registerHyperliquidTools(server);
  registerGuideTools(server);
  registerFreqtradeTools(server);
  registerFreqtradeDevTools(server);
  registerFtDeployTools(server);
  registerAutoTradeTools(server);
}
