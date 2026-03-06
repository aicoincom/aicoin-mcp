/**
 * Guide tools - help users with auth, registration, and setup
 * Merged: guide_get_api_key + guide_upgrade_tier + guide_setup_ccxt_trade → guide (3→1)
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerGuideTools(server: McpServer) {
  server.tool(
    'guide',
    'Setup guides. Actions: api_key (get AiCoin API key), upgrade (tier comparison), trade_setup (exchange trading setup)',
    {
      action: z.enum(['api_key', 'upgrade', 'trade_setup']).describe(
        'api_key: register & get API key; upgrade: tier comparison & upgrade; trade_setup: exchange trading setup'
      ),
      current_error: z
        .string()
        .optional()
        .describe('For upgrade: the error message received'),
      endpoint: z
        .string()
        .optional()
        .describe('For upgrade: the endpoint that returned 403'),
      exchange: z
        .string()
        .optional()
        .describe(
          'For trade_setup: target exchange (binance, okx, bybit, bitget, gate, htx, pionex, hyperliquid)'
        ),
    },
    async ({ action, current_error, endpoint, exchange }) => {
      switch (action) {
        case 'api_key':
          return { content: [{ type: 'text', text: getApiKeyGuide() }] };
        case 'upgrade':
          return { content: [{ type: 'text', text: getUpgradeGuide(current_error, endpoint) }] };
        case 'trade_setup':
          return { content: [{ type: 'text', text: getTradeSetupGuide(exchange) }] };
      }
    }
  );
}

function getApiKeyGuide(): string {
  return `# AiCoin OpenAPI Key Setup Guide

## Step 1: Register / Login
Visit https://www.aicoin.com and create an account (or log in).

## Step 2: Go to OpenAPI Management
Visit https://www.aicoin.com/opendata to manage your API keys.

## Step 3: Create API Key
Click "Create Key" and select your desired tier:

| Tier | Price | Rate Limit | Monthly Quota | Features |
|------|-------|------------|---------------|----------|
| Free | $0 | 15 req/min | 20K | Market, coin & special data |
| Basic | $29/mo | 30 req/min | 20K | + Content data |
| Standard | $79/mo | 80 req/min | 500K | + Content data |
| Advanced | $299/mo | 300 req/min | 1.5M | + Content data, commercial use |
| Professional | $699/mo | 1200 req/min | 3.5M | + Content data, commercial use |

## Step 4: Configure MCP Server
After creating the key, you will get two values:
- **accessKeyId** — your public key ID
- **accessSecret** — your signing secret

Add them to your MCP client config:

\`\`\`json
{
  "mcpServers": {
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/aicoin-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "<your accessKeyId>",
        "AICOIN_ACCESS_SECRET": "<your accessSecret>"
      }
    }
  }
}
\`\`\`

After updating the config, restart your MCP client to apply.`;
}

function getUpgradeGuide(currentError?: string, endpoint?: string): string {
  return `# AiCoin API Tier Upgrade Guide

## Current Issue
${currentError ? `Error: ${currentError}` : 'Your current API tier does not have permission for this endpoint.'}
${endpoint ? `Endpoint: ${endpoint}` : ''}

## API Tier Comparison

| Feature | Free ($0) | Basic ($29) | Standard ($79) | Advanced ($299) | Professional ($699) |
|---------|:---:|:---:|:---:|:---:|:---:|
| Market data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Coin data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Special data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Content data | ❌ | ✅ | ✅ | ✅ | ✅ |
| Rate limit | 15/min | 30/min | 80/min | 300/min | 1200/min |
| Monthly quota | 20K | 20K | 500K | 1.5M | 3.5M |
| Commercial use | ❌ | ❌ | ❌ | ✅ | ✅ |

## How to Upgrade
1. Visit https://www.aicoin.com/opendata
2. Go to your API key management page
3. Click "Upgrade" on your current key
4. Select the tier that includes the features you need
5. Complete payment

After upgrading, your existing key will be automatically upgraded. No config changes needed.`;
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
      '1. Hyperliquid is a **DEX** — NO API key page. Auth uses your EVM wallet.\n2. `HYPERLIQUID_API_KEY` = your wallet address (the 0x... shown in MetaMask/Rabby)\n3. `HYPERLIQUID_API_SECRET` = your private key. Two options:\n   - **Agent Wallet (recommended)**: On https://app.hyperliquid.xyz → Settings → Agent Wallet → Create. Limited-permission key (trade only, cannot withdraw).\n   - **Wallet private key**: Export from MetaMask (Settings → Security → Export Private Key). Full permissions — use with caution.\n4. Symbol format: use USDC, NOT USDT — e.g. `BTC/USDC:USDC`, `ETH/USDC:USDC`',
  };
  return guides[ex] || guides.binance;
}

function getTradeSetupGuide(exchange?: string): string {
  const ex = exchange?.toLowerCase() || 'binance';
  const isHL = ex === 'hyperliquid';
  const needsPass = ex === 'okx' || ex === 'bitget';
  const EX = ex.toUpperCase();

  let keyBlock: string;
  let envJson: string;

  if (isHL) {
    keyBlock = `# Hyperliquid (DEX — wallet-based, NOT API key)\nHYPERLIQUID_API_KEY=0x1234...your_wallet_address\nHYPERLIQUID_API_SECRET=0xabcd...your_private_key`;
    envJson = `        "HYPERLIQUID_API_KEY": "<your 0x... wallet address>",\n        "HYPERLIQUID_API_SECRET": "<your 0x... private key>"`;
  } else {
    keyBlock = `${EX}_API_KEY=your_api_key\n${EX}_API_SECRET=your_secret`;
    if (needsPass) keyBlock += `\n${EX}_PASSWORD=your_passphrase`;
    envJson = `        "${EX}_API_KEY": "<your_api_key>",\n        "${EX}_API_SECRET": "<your_secret>"`;
    if (needsPass) {
      envJson += `,\n        "${EX}_PASSWORD": "<your_passphrase>"`;
    }
  }

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
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/aicoin-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "<your opendata key>",
        "AICOIN_ACCESS_SECRET": "<your opendata secret>",
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
