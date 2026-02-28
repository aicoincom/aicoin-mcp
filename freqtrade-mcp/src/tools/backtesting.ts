/**
 * Backtesting tools — start, monitor, and review backtests
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFreqtradeClient } from '../freqtrade/client.js';
import { ok, err } from './utils.js';

export function registerBacktestingTools(server: McpServer) {
  server.tool(
    'ft_start_backtest',
    'Start a backtest with the specified strategy and parameters',
    {
      strategy: z.string().describe('Strategy class name to backtest'),
      timerange: z
        .string()
        .optional()
        .describe('Time range, e.g. 20240101-20240601'),
      timeframe: z
        .string()
        .optional()
        .describe('Candle timeframe, e.g. 5m, 1h, 1d'),
      max_open_trades: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Max concurrent open trades'),
      stake_amount: z
        .union([z.number().positive(), z.literal('unlimited')])
        .optional()
        .describe('Stake amount per trade or "unlimited"'),
      enable_protections: z
        .boolean()
        .optional()
        .describe('Enable trading protections'),
      dry_run_wallet: z
        .number()
        .positive()
        .optional()
        .describe('Simulated wallet balance'),
    },
    async ({
      strategy,
      timerange,
      timeframe,
      max_open_trades,
      stake_amount,
      enable_protections,
      dry_run_wallet,
    }) => {
      try {
        const client = getFreqtradeClient();
        const req: Record<string, unknown> = {
          strategy,
          enable_protections: enable_protections ?? false,
        };
        if (timerange) req.timerange = timerange;
        if (timeframe) req.timeframe = timeframe;
        if (max_open_trades !== undefined)
          req.max_open_trades = max_open_trades;
        if (stake_amount !== undefined) req.stake_amount = stake_amount;
        if (dry_run_wallet !== undefined)
          req.dry_run_wallet = dry_run_wallet;
        const result = await client.startBacktest(req as never);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_get_backtest',
    'Get current backtest status and results',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.getBacktest();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_abort_backtest',
    'Abort a running backtest',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.abortBacktest();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_delete_backtest',
    'Clear backtest state and results',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.deleteBacktest();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_backtest_history',
    'List all backtest history entries',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.backtestHistory();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_backtest_history_result',
    'Get a specific backtest result from history',
    {
      filename: z.string().describe('Backtest result filename'),
      strategy: z.string().describe('Strategy name used in the backtest'),
    },
    async ({ filename, strategy }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.backtestHistoryResult(filename, strategy);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );
}
