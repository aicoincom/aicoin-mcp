/**
 * Freqtrade dev tools — 4 consolidated tools (#12–#15)
 * ft_backtest, ft_candles, ft_pairlist, ft_strategy
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFreqtradeClient } from '../freqtrade/client.js';
import { ok, err } from './utils.js';
import { generateBasicStrategy } from '../strategy-templates/base.js';
import { generateAiCoinStrategy } from '../strategy-templates/aicoin-data.js';
import { generateRsiBbStrategy } from '../strategy-templates/rsi-bb.js';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// tsup bundles all code into build/index.js, so __dirname = build/
// Resolve to package root: build/ -> aicoin-mcp/
const __pkgroot = join(dirname(fileURLToPath(import.meta.url)), '..');

function getUserDataPath(): string {
  const p = process.env.FREQTRADE_USER_DATA;
  if (!p) {
    throw new Error(
      'FREQTRADE_USER_DATA is not set. Configure it to point to your Freqtrade user_data directory.'
    );
  }
  return p;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function registerFreqtradeDevTools(server: McpServer) {
  // #12 ft_backtest — start / status / abort / delete / history / history_result
  server.tool(
    'ft_backtest',
    'Freqtrade backtesting.\n' +
      '- start: start a backtest (requires strategy, optional params)\n' +
      '- status: get current backtest progress/results\n' +
      '- abort: abort running backtest\n' +
      '- delete: clear backtest state\n' +
      '- history: list all backtest history entries\n' +
      '- history_result: get specific result (requires filename & strategy)',
    {
      action: z
        .enum(['start', 'status', 'abort', 'delete', 'history', 'history_result'])
        .describe('Backtest action'),
      strategy: z
        .string()
        .optional()
        .describe('Strategy class name (required for start & history_result)'),
      timerange: z
        .string()
        .optional()
        .describe('Time range, e.g. 20240101-20240601 (for start)'),
      timeframe: z
        .string()
        .optional()
        .describe('Candle timeframe, e.g. 5m, 1h (for start)'),
      max_open_trades: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Max concurrent open trades (for start)'),
      stake_amount: z
        .union([z.number().positive(), z.literal('unlimited')])
        .optional()
        .describe('Stake amount or "unlimited" (for start)'),
      enable_protections: z
        .boolean()
        .optional()
        .describe('Enable trading protections (for start)'),
      dry_run_wallet: z
        .number()
        .positive()
        .optional()
        .describe('Simulated wallet balance (for start)'),
      filename: z
        .string()
        .optional()
        .describe('Backtest result filename (for history_result)'),
    },
    async ({
      action,
      strategy,
      timerange,
      timeframe,
      max_open_trades,
      stake_amount,
      enable_protections,
      dry_run_wallet,
      filename,
    }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'start': {
            if (!strategy) return err('strategy is required for start action');
            const req: Record<string, unknown> = {
              strategy,
              enable_protections: enable_protections ?? false,
            };
            if (timerange) req.timerange = timerange;
            if (timeframe) req.timeframe = timeframe;
            if (max_open_trades !== undefined) req.max_open_trades = max_open_trades;
            if (stake_amount !== undefined) req.stake_amount = stake_amount;
            if (dry_run_wallet !== undefined) req.dry_run_wallet = dry_run_wallet;
            return ok(await client.startBacktest(req as never));
          }
          case 'status':
            return ok(await client.getBacktest());
          case 'abort':
            return ok(await client.abortBacktest());
          case 'delete':
            return ok(await client.deleteBacktest());
          case 'history':
            return ok(await client.backtestHistory());
          case 'history_result': {
            if (!filename) return err('filename is required for history_result action');
            if (!strategy) return err('strategy is required for history_result action');
            return ok(await client.backtestHistoryResult(filename, strategy));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #13 ft_candles — live / analyzed / available
  server.tool(
    'ft_candles',
    'Freqtrade K-line / candle data.\n' +
      '- live: live candlestick data (pair + timeframe required)\n' +
      '- analyzed: historical data with strategy indicators (pair + timeframe + strategy required)\n' +
      '- available: list available pairs with downloaded data',
    {
      action: z
        .enum(['live', 'analyzed', 'available'])
        .describe('Candle data query type'),
      pair: z
        .string()
        .optional()
        .describe('Trading pair, e.g. BTC/USDT (for live & analyzed)'),
      timeframe: z
        .string()
        .optional()
        .describe('Candle timeframe, e.g. 5m, 1h (for live, analyzed, available)'),
      strategy: z
        .string()
        .optional()
        .describe('Strategy name (required for analyzed)'),
      timerange: z
        .string()
        .optional()
        .describe('Time range, e.g. 20240101-20240601 (for analyzed)'),
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Max candles to return (for live)'),
      stake_currency: z
        .string()
        .optional()
        .describe('Filter by stake currency (for available)'),
    },
    async ({ action, pair, timeframe, strategy, timerange, limit, stake_currency }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'live': {
            if (!pair) return err('pair is required for live action');
            if (!timeframe) return err('timeframe is required for live action');
            return ok(await client.pairCandles(pair, timeframe, limit));
          }
          case 'analyzed': {
            if (!pair) return err('pair is required for analyzed action');
            if (!timeframe) return err('timeframe is required for analyzed action');
            if (!strategy) return err('strategy is required for analyzed action');
            return ok(await client.pairHistory(pair, timeframe, strategy, timerange));
          }
          case 'available':
            return ok(await client.availablePairs(timeframe, stake_currency));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #14 ft_pairlist — whitelist / blacklist / locks
  server.tool(
    'ft_pairlist',
    'Trading pair management. Requires bot running with a strategy.\n' +
      '- whitelist: get current whitelist\n' +
      '- blacklist: view or add pairs to blacklist (optional add array)\n' +
      '- locks: view current pair trading locks',
    {
      action: z
        .enum(['whitelist', 'blacklist', 'locks'])
        .describe('Pairlist action'),
      add: z
        .array(z.string())
        .optional()
        .describe('Pairs to add to blacklist, e.g. ["BNB/BTC"] (for blacklist)'),
    },
    async ({ action, add }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'whitelist':
            return ok(await client.whitelist());
          case 'blacklist':
            return ok(await client.blacklist(add));
          case 'locks':
            return ok(await client.locks());
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #15 ft_strategy — list / get / create / deploy_provider
  server.tool(
    'ft_strategy',
    'Strategy management.\n' +
      '- list: list all available strategies\n' +
      '- get: get strategy source code (requires strategy name)\n' +
      '- create: create strategy from template (requires name)\n' +
      '- deploy_provider: deploy aicoin_provider.py to strategies dir',
    {
      action: z
        .enum(['list', 'get', 'create', 'deploy_provider'])
        .describe('Strategy action'),
      strategy: z
        .string()
        .optional()
        .describe('Strategy class name (for get)'),
      name: z
        .string()
        .regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
        .optional()
        .describe('New strategy class name (for create, valid Python identifier)'),
      template: z
        .enum(['basic', 'aicoin_data', 'rsi_bb'])
        .optional()
        .default('basic')
        .describe('Template: basic, aicoin_data, rsi_bb (for create)'),
      timeframe: z
        .string()
        .optional()
        .describe('Candle timeframe (for create)'),
      stoploss: z
        .number()
        .negative()
        .optional()
        .describe('Stop loss ratio, e.g. -0.1 (for create)'),
      roi: z
        .record(z.string(), z.number())
        .optional()
        .describe('ROI table, e.g. {"0": 0.1, "40": 0.05} (for create)'),
      overwrite: z
        .boolean()
        .optional()
        .default(false)
        .describe('Overwrite existing file (for deploy_provider)'),
    },
    async ({ action, strategy, name, template, timeframe, stoploss, roi, overwrite }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'list':
            return ok(await client.strategies());
          case 'get': {
            if (!strategy) return err('strategy name is required for get action');
            return ok(await client.strategy(strategy));
          }
          case 'create': {
            if (!name) return err('name is required for create action');
            const userDataPath = getUserDataPath();
            const strategiesDir = join(userDataPath, 'strategies');
            const filePath = join(strategiesDir, `${name}.py`);

            await mkdir(strategiesDir, { recursive: true });

            if (await fileExists(filePath)) {
              return err(
                `Strategy file already exists: ${filePath}. Delete it first or use a different name.`
              );
            }

            const params = { name, timeframe, stoploss, roi };
            let code: string;
            switch (template) {
              case 'aicoin_data':
                code = generateAiCoinStrategy(params as never);
                break;
              case 'rsi_bb':
                code = generateRsiBbStrategy(params as never);
                break;
              default:
                code = generateBasicStrategy(params as never);
            }

            await writeFile(filePath, code, 'utf-8');

            // Auto-deploy aicoin_provider if using aicoin_data template
            if (template === 'aicoin_data') {
              const providerPath = join(strategiesDir, 'aicoin_provider.py');
              if (!(await fileExists(providerPath))) {
                try {
                  const srcProvider = join(__pkgroot, 'python', 'aicoin_provider.py');
                  const providerCode = await readFile(srcProvider, 'utf-8');
                  await writeFile(providerPath, providerCode, 'utf-8');
                } catch {
                  // Provider file not bundled, skip auto-deploy
                }
              }
            }

            return ok({
              message: `Strategy "${name}" created successfully`,
              file: filePath,
              template,
            });
          }
          case 'deploy_provider': {
            const userDataPath = getUserDataPath();
            const targetPath = join(userDataPath, 'strategies', 'aicoin_provider.py');

            if (!overwrite && (await fileExists(targetPath))) {
              return err(
                `aicoin_provider.py already exists at ${targetPath}. Use overwrite=true to replace it.`
              );
            }

            const srcPath = join(__pkgroot, 'python', 'aicoin_provider.py');
            const code = await readFile(srcPath, 'utf-8');
            await mkdir(dirname(targetPath), { recursive: true });
            await writeFile(targetPath, code, 'utf-8');

            return ok({
              message: 'aicoin_provider.py deployed successfully',
              path: targetPath,
            });
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
