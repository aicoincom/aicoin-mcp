/**
 * Freqtrade deployment tool — shells out to scripts/ft-deploy.mjs
 * 10 actions consolidated into 1 MCP tool: check, deploy, update, status, start, stop, logs, backtest, download_data, remove
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ok, err } from './utils.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(__dir, '..', 'scripts', 'ft-deploy.mjs');

export function registerFtDeployTools(server: McpServer) {
  server.tool(
    'ft_deploy',
    'Freqtrade one-click deployment & management.\n• check — verify Python, git, exchange keys, running status\n• deploy — full setup (clone, install, config, start). Params: dry_run, strategy, pairs, trading_mode\n• update — update Freqtrade via setup.sh\n• status — check if running, show last logs\n• start — start Freqtrade. Params: strategy\n• stop — stop Freqtrade\n• logs — view recent logs. Params: lines\n• backtest — run strategy backtest. Params: strategy, timeframe, timerange\n• download_data — download OHLCV data. Params: timeframe, timerange\n• remove — stop and remove (config preserved)',
    {
      action: z.enum([
        'check', 'deploy', 'update', 'status',
        'start', 'stop', 'logs', 'backtest',
        'download_data', 'remove',
      ]).describe('Action to perform'),
      strategy: z.string().optional().describe('Strategy name (default: SampleStrategy)'),
      timeframe: z.string().optional().describe('For backtest/download_data: candle timeframe, e.g. 1h, 5m'),
      timerange: z.string().optional().describe('For backtest/download_data: date range, e.g. 20240101-20240601'),
      dry_run: z.boolean().optional().describe('For deploy: true=paper trading (default), false=live'),
      pairs: z.array(z.string()).optional().describe('For deploy: trading pairs, e.g. ["BTC/USDT:USDT"]'),
      trading_mode: z.enum(['futures', 'spot']).optional().describe('For deploy: trading mode (default: futures)'),
      lines: z.number().optional().describe('For logs: number of lines to show (default: 50)'),
    },
    async ({ action, strategy, timeframe, timerange, dry_run, pairs, trading_mode, lines }) => {
      try {
        // Build params object from non-undefined values
        const params: Record<string, unknown> = {};
        if (strategy !== undefined) params.strategy = strategy;
        if (timeframe !== undefined) params.timeframe = timeframe;
        if (timerange !== undefined) params.timerange = timerange;
        if (dry_run !== undefined) params.dry_run = dry_run;
        if (pairs !== undefined) params.pairs = pairs;
        if (trading_mode !== undefined) params.trading_mode = trading_mode;
        if (lines !== undefined) params.lines = lines;

        const paramsArg = Object.keys(params).length > 0
          ? ` '${JSON.stringify(params)}'`
          : '';

        const output = execSync(
          `node ${SCRIPT} ${action}${paramsArg}`,
          { encoding: 'utf-8', timeout: 600000 }
        ).trim();

        try {
          return ok(JSON.parse(output));
        } catch {
          return ok({ output });
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
