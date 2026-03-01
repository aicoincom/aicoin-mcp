#!/usr/bin/env node
/**
 * AiCoin MCP Server
 * Unified crypto market data & trading via AiCoin API + CCXT
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(
    resolve(__dirname, '..', 'package.json'),
    'utf-8'
  )
) as { version: string };

const server = new McpServer({
  name: 'aicoin-mcp',
  version: pkg.version,
});

registerAllTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
