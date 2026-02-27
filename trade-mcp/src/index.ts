#!/usr/bin/env node
/**
 * AiCoin Trade MCP Server
 * AI-powered cryptocurrency trading via ccxt with AiCoin broker IDs
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';

const server = new McpServer({
  name: 'aicoin-trade',
  version: '1.0.2',
});

registerAllTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
