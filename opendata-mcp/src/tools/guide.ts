/**
 * Guide tools - help users with auth, registration, and setup
 * Merged: guide_get_api_key + guide_upgrade_tier → guide (2→1)
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerGuideTools(server: McpServer) {
  server.tool(
    'guide',
    'Setup guides. Actions: api_key (get AiCoin API key), upgrade (tier comparison)',
    {
      action: z.enum(['api_key', 'upgrade']).describe(
        'api_key: register & get API key; upgrade: tier comparison & upgrade'
      ),
      current_error: z
        .string()
        .optional()
        .describe('For upgrade: the error message received'),
      endpoint: z
        .string()
        .optional()
        .describe('For upgrade: the endpoint that returned 403'),
    },
    async ({ action, current_error, endpoint }) => {
      switch (action) {
        case 'api_key':
          return { content: [{ type: 'text', text: getApiKeyGuide() }] };
        case 'upgrade':
          return { content: [{ type: 'text', text: getUpgradeGuide(current_error, endpoint) }] };
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

After updating the config, restart your MCP client to apply.

## Want Trading Features?
For exchange trading (place orders, check balances), use the full AiCoin MCP:
\`\`\`
npx -y @aicoin/aicoin-mcp
\`\`\``;
}

function getUpgradeGuide(currentError?: string, endpoint?: string): string {
  return `# AiCoin API Tier Upgrade Guide

## Current Issue
${currentError ? `Error: ${currentError}` : 'Your current API tier does not have permission for this endpoint.'}
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
1. Visit https://www.aicoin.com/opendata
2. Go to your API key management page
3. Click "Upgrade" on your current key
4. Select the tier that includes the features you need
5. Complete payment

After upgrading, your existing key will be automatically upgraded. No config changes needed.`;
}
