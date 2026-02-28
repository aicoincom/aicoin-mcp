#!/usr/bin/env node
/**
 * AiCoin Freqtrade MCP Server
 * AI-powered Freqtrade bot management via MCP protocol
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';

const server = new McpServer({
  name: 'aicoin-freqtrade',
  version: '0.1.0',
});

registerAllTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
