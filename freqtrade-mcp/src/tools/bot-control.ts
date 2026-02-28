/**
 * Bot control tools — ft_ping, ft_start, ft_stop, etc.
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFreqtradeClient } from '../freqtrade/client.js';
import { ok, err } from './utils.js';

export function registerBotControlTools(server: McpServer) {
  server.tool(
    'ft_ping',
    'Check if Freqtrade bot is online and responsive',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.ping();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_start',
    'Start the Freqtrade bot trading',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.start();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_stop',
    'Stop the Freqtrade bot trading',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.stop();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_reload_config',
    'Reload Freqtrade configuration',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.reloadConfig();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_show_config',
    'Show current Freqtrade configuration (strategy, exchange, trading mode, etc.)',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.showConfig();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_version',
    'Get Freqtrade version',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.version();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_sysinfo',
    'Get system resource info (CPU, RAM usage)',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.sysinfo();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_health',
    'Health check for the running Freqtrade bot',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.health();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_logs',
    'Get Freqtrade bot logs',
    {
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Max number of log entries to return'),
    },
    async ({ limit }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.logs(limit);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );
}
