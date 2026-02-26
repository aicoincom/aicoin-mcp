#!/usr/bin/env node
/**
 * AiCoin OpenData MCP Server
 * Crypto market data via AiCoin Open API
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';

const server = new McpServer({
  name: 'aicoin-opendata',
  version: '1.0.0',
});

registerAllTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
