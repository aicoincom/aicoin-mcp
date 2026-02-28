/**
 * Strategy management tools — list, view, create strategies, deploy aicoin_provider
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
// Resolve to package root: build/ -> freqtrade-mcp/
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

export function registerStrategyTools(server: McpServer) {
  server.tool(
    'ft_list_strategies',
    'List all available strategies in Freqtrade',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.strategies();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_get_strategy',
    'Get strategy details including source code',
    {
      strategy: z.string().describe('Strategy class name'),
    },
    async ({ strategy }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.strategy(strategy);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_create_strategy',
    'Create a new strategy from a template and save to user_data/strategies/',
    {
      name: z
        .string()
        .regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
        .describe('Strategy class name (valid Python identifier)'),
      template: z
        .enum(['basic', 'aicoin_data', 'rsi_bb'])
        .optional()
        .default('basic')
        .describe('Template: basic, aicoin_data (with AiCoin data), rsi_bb (RSI+Bollinger)'),
      timeframe: z.string().optional().describe('Candle timeframe, e.g. 1h, 5m'),
      stoploss: z.number().negative().optional().describe('Stop loss ratio, e.g. -0.1 for 10%'),
      roi: z
        .record(z.string(), z.number())
        .optional()
        .describe('ROI table, e.g. {"0": 0.1, "40": 0.05}'),
    },
    async ({ name, template, timeframe, stoploss, roi }) => {
      try {
        const userDataPath = getUserDataPath();
        const strategiesDir = join(userDataPath, 'strategies');
        const filePath = join(strategiesDir, `${name}.py`);

        await mkdir(strategiesDir, { recursive: true });

        if (await fileExists(filePath)) {
          return err(`Strategy file already exists: ${filePath}. Delete it first or use a different name.`);
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
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_deploy_aicoin_provider',
    'Deploy aicoin_provider.py to Freqtrade user_data/strategies/ for AiCoin data access in strategies',
    {
      overwrite: z
        .boolean()
        .optional()
        .default(false)
        .describe('Overwrite existing file if present'),
    },
    async ({ overwrite }) => {
      try {
        const userDataPath = getUserDataPath();
        const targetPath = join(userDataPath, 'strategies', 'aicoin_provider.py');

        if (!overwrite && (await fileExists(targetPath))) {
          return err(
            `aicoin_provider.py already exists at ${targetPath}. Use overwrite=true to replace it.`
          );
        }

        // Read from bundled python/ directory
        const srcPath = join(__pkgroot, 'python', 'aicoin_provider.py');
        const code = await readFile(srcPath, 'utf-8');
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, code, 'utf-8');

        return ok({
          message: 'aicoin_provider.py deployed successfully',
          path: targetPath,
        });
      } catch (e) {
        return err(e);
      }
    }
  );
}
