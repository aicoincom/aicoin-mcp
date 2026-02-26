/**
 * Guidance tools - help users with auth, registration, and setup
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerGuideTools(server: McpServer) {
  server.tool(
    'guide_get_api_key',
    'Guide user to register AiCoin account and generate OpenAPI key. Call this when API returns 401/403 or credentials are missing.',
    {},
    async () => {
      const guide = `# AiCoin OpenAPI Key Setup Guide

## Step 1: Register / Login
Visit https://www.aicoin.com and create an account (or log in).

## Step 2: Go to OpenAPI Management
Visit https://www.aicoin.com/openapi to manage your API keys.

## Step 3: Create API Key
Click "Create Key" and select your desired tier:

| Tier | Price | Rate Limit | Features |
|------|-------|------------|----------|
| Basic | Free | 10 req/min | Market data, news, basic indicators |
| Normal | ¥99/mo | 60 req/min | + Funding rate, liquidation data |
| Premium | ¥299/mo | 120 req/min | + Depth data, whale tracking |
| Professional | ¥999/mo | 300 req/min | + Full depth, all features |

## Step 4: Configure MCP Server
After creating the key, you will get two values:
- **accessKeyId** — your public key ID
- **accessSecret** — your signing secret

Add them to your MCP client config:

\`\`\`json
{
  "mcpServers": {
    "aicoin-opendata": {
      "command": "npx",
      "args": ["-y", "@aicoin/opendata-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "<your accessKeyId>",
        "AICOIN_ACCESS_SECRET": "<your accessSecret>"
      }
    }
  }
}
\`\`\`

After updating the config, restart your MCP client to apply.`;

      return {
        content: [{ type: 'text', text: guide }],
      };
    }
  );

  server.tool(
    'guide_upgrade_tier',
    'Guide user to upgrade API tier when current tier lacks permission for certain endpoints. Call this when API returns 403 or feature is tier-restricted.',
    {
      current_error: z
        .string()
        .optional()
        .describe('The error message received'),
      endpoint: z
        .string()
        .optional()
        .describe('The endpoint that returned 403'),
    },
    async ({ current_error, endpoint }) => {
      const guide = `# AiCoin API Tier Upgrade Guide

## Current Issue
${current_error ? `Error: ${current_error}` : 'Your current API tier does not have permission for this endpoint.'}
${endpoint ? `Endpoint: ${endpoint}` : ''}

## API Tier Comparison

| Feature | Basic (Free) | Normal (¥99) | Premium (¥299) | Professional (¥999) |
|---------|:---:|:---:|:---:|:---:|
| Market tickers & K-lines | ✅ | ✅ | ✅ | ✅ |
| News & flash | ✅ | ✅ | ✅ | ✅ |
| Index data | ✅ | ✅ | ✅ | ✅ |
| Funding rate history | ❌ | ✅ | ✅ | ✅ |
| Liquidation data | ❌ | ✅ | ✅ | ✅ |
| OI history | ❌ | ✅ | ✅ | ✅ |
| Whale order tracking | ❌ | ❌ | ✅ | ✅ |
| Depth data | ❌ | ❌ | ✅ | ✅ |
| Strategy signals | ❌ | ❌ | ❌ | ✅ |
| Full depth & grouped | ❌ | ❌ | ❌ | ✅ |

## How to Upgrade
1. Visit https://www.aicoin.com/openapi
2. Go to your API key management page
3. Click "Upgrade" on your current key
4. Select the tier that includes the features you need
5. Complete payment

After upgrading, your existing key will be automatically upgraded. No config changes needed.`;

      return {
        content: [{ type: 'text', text: guide }],
      };
    }
  );

  server.tool(
    'guide_setup_ccxt_trade',
    'Guide user to set up the AiCoin Trade MCP server (CCXT-based) for executing trades. Includes exchange API key setup and local proxy configuration.',
    {
      exchange: z
        .string()
        .optional()
        .describe(
          'Target exchange: binance, okx, bybit, bitget, gate, huobi, pionex, hyperliquid'
        ),
    },
    async ({ exchange }) => {
      const ex = exchange?.toLowerCase() || 'binance';
      const needsPass = ex === 'okx' || ex === 'bitget';
      const EX = ex.toUpperCase();

      let keyBlock = `${EX}_API_KEY=your_api_key\n${EX}_SECRET=your_secret`;
      if (needsPass) keyBlock += `\n${EX}_PASSPHRASE=your_passphrase`;

      let envJson = `        "${EX}_API_KEY": "<your_api_key>",\n        "${EX}_SECRET": "<your_secret>"`;
      if (needsPass) {
        envJson += `,\n        "${EX}_PASSPHRASE": "<your_passphrase>"`;
      }

      const guide = getTradeGuide(ex, EX, keyBlock, envJson);
      return {
        content: [{ type: 'text', text: guide }],
      };
    }
  );
}

function getExchangeGuide(ex: string): string {
  const guides: Record<string, string> = {
    binance:
      '1. Log in to https://www.binance.com\n2. Go to Account → API Management\n3. Create API key, enable "Spot Trading" permission\n4. Recommended: set IP whitelist',
    okx:
      '1. Log in to https://www.okx.com\n2. Go to Account → API → Create API Key\n3. Set passphrase, enable "Trade" permission\n4. Note: OKX requires a passphrase in addition to key/secret',
    bybit:
      '1. Log in to https://www.bybit.com\n2. Go to Account → API Management\n3. Create API key with "Trade" permission',
    bitget:
      '1. Log in to https://www.bitget.com\n2. Go to Account → API Management\n3. Create API key with passphrase, enable "Trade"\n4. Note: Bitget requires a passphrase',
    gate:
      '1. Log in to https://www.gate.io\n2. Go to Account → API Management\n3. Create API key with "Spot Trade" permission',
    huobi:
      '1. Log in to https://www.huobi.com\n2. Go to Account → API Management\n3. Create API key with "Trade" permission',
    pionex:
      '1. Log in to https://www.pionex.com\n2. Go to Account → API Management\n3. Create API key',
    hyperliquid:
      '1. Visit https://app.hyperliquid.xyz\n2. Connect your wallet\n3. Go to API → Generate API Key',
  };
  return guides[ex] || guides.binance;
}

function getTradeGuide(
  ex: string,
  EX: string,
  keyBlock: string,
  envJson: string
): string {
  return `# AiCoin Trade MCP Setup Guide (CCXT)

> All API keys are stored locally only. They are never sent to AiCoin servers.

## Step 1: Get Exchange API Key

${getExchangeGuide(ex)}

\`\`\`
${keyBlock}
\`\`\`

## Step 2: Proxy Configuration

Many exchanges require proxy access in certain regions.
If you are in mainland China or behind a firewall, you likely need a local proxy.

- If YES: set \`USE_PROXY=true\` and \`PROXY_URL\` (default: \`http://127.0.0.1:7890\`)
- If NO: set \`USE_PROXY=false\` or leave it unset

Common proxy ports:
- Clash: 7890
- V2Ray: 10808
- Shadowsocks: 1080

## Step 3: Configure MCP Client

\`\`\`json
{
  "mcpServers": {
    "aicoin-trade": {
      "command": "npx",
      "args": ["-y", "@aicoin/trade-mcp"],
      "env": {
        "DEFAULT_EXCHANGE": "${ex}",
${envJson},
        "USE_PROXY": "true",
        "PROXY_URL": "http://127.0.0.1:7890"
      }
    }
  }
}
\`\`\`

## Security Notes
- API keys are stored in your local MCP config only
- Never share your secret key with anyone
- Enable IP whitelist on the exchange if possible
- For trading, enable "Trade" permission; disable "Withdraw"`;
}
