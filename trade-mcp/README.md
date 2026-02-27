# AiCoin Trade MCP Server

AI-powered cryptocurrency trading via ccxt.

## Features

- 24 trading tools (9 public + 15 private)
- 9 supported exchanges
- Exchange API keys stored locally via env vars (never sent to cloud)
- stdio transport for local MCP clients

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your exchange API keys
npm run build
npm start
```

## Environment Variables

```bash
DEFAULT_EXCHANGE=binance

BINANCE_API_KEY=your_key
BINANCE_SECRET=your_secret

OKX_API_KEY=your_key
OKX_SECRET=your_secret
OKX_PASSPHRASE=your_passphrase

BYBIT_API_KEY=your_key
BYBIT_SECRET=your_secret

USE_PROXY=false
PROXY_URL=http://127.0.0.1:7890
```

## Available Tools

### Public (no API key required)

| Tool | Description |
|------|-------------|
| `list_exchanges` | List all 9 supported exchanges |
| `get_ticker` | Real-time ticker for a trading pair |
| `get_tickers` | Batch tickers for multiple pairs |
| `get_ohlcv` | K-line/candlestick data |
| `get_orderbook` | Order book depth |
| `get_trades` | Recent trades |
| `get_markets` | All trading pairs on an exchange |
| `get_funding_rates` | Perpetual contract funding rates |
| `get_funding_rate_history` | Historical funding rates |

### Private (requires exchange API key)

| Tool | Description |
|------|-------------|
| `get_balance` | Account balance |
| `create_order` | Place market/limit order |
| `cancel_order` | Cancel an open order |
| `cancel_all_orders` | Cancel all open orders for a symbol |
| `get_order` | Get order details by ID |
| `get_open_orders` | List unfilled orders |
| `get_closed_orders` | List filled/cancelled orders |
| `get_my_trades` | Get personal trade history |
| `get_positions` | Open positions (futures/swap) |
| `set_leverage` | Set leverage multiplier |
| `set_margin_mode` | Set cross/isolated margin |
| `get_ledger` | Account ledger entries |
| `get_deposits` | Deposit history |
| `get_withdrawals` | Withdrawal history |
| `transfer` | Transfer between accounts |

## Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aicoin-trade": {
      "command": "npx",
      "args": ["-y", "@aicoin/trade-mcp"],
      "env": {
        "DEFAULT_EXCHANGE": "okx",
        "OKX_API_KEY": "your_key",
        "OKX_SECRET": "your_secret",
        "OKX_PASSPHRASE": "your_passphrase"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "aicoin-trade": {
      "command": "npx",
      "args": ["-y", "@aicoin/trade-mcp"],
      "env": {
        "DEFAULT_EXCHANGE": "binance",
        "BINANCE_API_KEY": "your_key",
        "BINANCE_SECRET": "your_secret"
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json` (same format as Cursor).

### VS Code (Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "aicoin-trade": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@aicoin/trade-mcp"],
      "env": {
        "DEFAULT_EXCHANGE": "okx",
        "OKX_API_KEY": "your_key",
        "OKX_SECRET": "your_secret",
        "OKX_PASSPHRASE": "your_passphrase"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add aicoin-trade -- npx -y @aicoin/trade-mcp
```

## Supported Exchanges

binance, binanceusdm, binancecoinm, okx, bybit, bitget, gate, huobi, hyperliquid
