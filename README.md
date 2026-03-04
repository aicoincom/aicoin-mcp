# AiCoin MCP Server

Real-time crypto market data & exchange trading for any AI assistant.

**41 tools** in one package — market data, K-lines, funding rates, liquidations, order flow, Hyperliquid on-chain analytics, news, and multi-exchange trading via CCXT.

[![npm](https://img.shields.io/npm/v/@aicoin/aicoin-mcp)](https://www.npmjs.com/package/@aicoin/aicoin-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[English](./aicoin-mcp/README.md) | [中文](./aicoin-mcp/README_CN.md)

## Quick Start

Works out of the box with a built-in free API key (15 req/min, IP rate-limited). No registration required.

### Claude Code

```bash
claude mcp add aicoin -- npx -y @aicoin/aicoin-mcp
```

### Cursor / Windsurf / Other MCP Clients

Add to your MCP config (`.mcp.json`, `claude_desktop_config.json`, etc.):

```json
{
  "mcpServers": {
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/aicoin-mcp"]
    }
  }
}
```

### Use Your Own API Key (Optional)

For higher rate limits and more endpoints, get a key at [aicoin.com/opendata](https://www.aicoin.com/opendata):

```json
{
  "mcpServers": {
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/aicoin-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "your-key-id",
        "AICOIN_ACCESS_SECRET": "your-secret"
      }
    }
  }
}
```

## What You Can Do

Ask your AI assistant things like:

- "What's the current price of BTC and ETH?"
- "Show me the BTC funding rate across exchanges"
- "Find whale positions on Hyperliquid"
- "Get the liquidation heatmap for ETH"
- "What are the latest crypto news?"
- "Place a limit buy order for 0.1 BTC at $60,000 on Binance"

## Tools Overview

### Market Data (30 tools)

| Tool | What it does |
|------|-------------|
| `coin_info` | Coin list, real-time prices, profiles, AI analysis |
| `coin_funding_rate` | Funding rate history (per-exchange or volume-weighted) |
| `coin_liquidation` | Liquidation heatmap, history, estimated liquidation chart |
| `coin_open_interest` | Aggregated OI history (stablecoin / coin-margined) |
| `coin_futures_data` | Futures order book history, large orders, trade data |
| `market_info` | Exchange list, platform tickers, trending coins, futures OI rankings |
| `kline` | Standard & indicator K-lines, trading pair discovery |
| `index_data` | Index prices, details, list of all available indexes |
| `crypto_stock` | Crypto-related stock quotes, top gainers, company info |
| `coin_treasury` | Corporate holdings (entities, trade history, accumulated) |
| `depth` | Real-time order book snapshots (latest, full, grouped) |
| `market_overview` | Market nav, long/short ratio, liquidation, grayscale, stocks |
| `order_flow` | Whale order tracking, aggregated large trades |
| `trading_pair` | Trading pair tickers, pairs by platform, filtered search |
| `signal_data` | Win-rate strategy signals, alerts, abnormal price movements |
| `signal_manage` | Manage signal alerts |
| `news` | Paginated news articles, full article detail, RSS feed |
| `flash` | Flash news, industry flashes, exchange listing announcements |
| `hl_ticker` | Hyperliquid tickers (single coin or all) |
| `hl_whale` | HL whale positions, events, long/short directions |
| `hl_liquidation` | HL liquidation history, stats, top liquidated positions |
| `hl_open_interest` | HL OI summary, top coins, per-coin history |
| `hl_taker` | HL taker buy/sell delta, K-lines with taker volume |
| `hl_trader` | HL trader stats, best trades, performance, batch analytics |
| `hl_fills` | HL trade fills by address/order/TWAP, top trades |
| `hl_orders` | HL orders (latest, filled, top open, active stats, TWAP) |
| `hl_position` | HL position history, PnL, execution trace |
| `hl_portfolio` | HL portfolio curve, PnL, max drawdown, net flow |
| `hl_advanced` | HL generic info API, smart money finder, trader discovery |
| `guide` | Setup guides for API key, tier upgrade, exchange trading |

### Exchange Trading (11 tools)

| Tool | What it does |
|------|-------------|
| `exchange_info` | List supported exchanges, query trading pairs |
| `exchange_ticker` | Real-time ticker (single or batch) |
| `exchange_market_data` | Order book, recent trades, OHLCV candlesticks |
| `exchange_funding` | Current and historical funding rates |
| `account_status` | Account balance and open positions |
| `account_orders` | Query open/closed orders, trade history |
| `account_history` | Ledger, deposit, and withdrawal history |
| `create_order` | Place market or limit orders |
| `cancel_order` | Cancel single or all open orders |
| `set_trading_config` | Set leverage and margin mode |
| `transfer` | Transfer funds between accounts (spot/futures) |

**Supported exchanges:** Binance, Binance USDM, Binance COINM, OKX, Bybit, Bitget, Gate, Huobi, Hyperliquid

## Enable Exchange Trading (Optional)

To place orders, check balances, and manage positions, add your exchange API key:

```json
{
  "env": {
    "AICOIN_ACCESS_KEY_ID": "your-key-id",
    "AICOIN_ACCESS_SECRET": "your-secret",
    "DEFAULT_EXCHANGE": "okx",
    "OKX_API_KEY": "your-exchange-key",
    "OKX_SECRET": "your-exchange-secret",
    "OKX_PASSPHRASE": "your-passphrase"
  }
}
```

> Exchange API keys are stored locally only and never sent to AiCoin servers.

## API Tiers

| Tier | Price | Rate Limit | Monthly Quota |
|------|-------|------------|---------------|
| Free | $0 | 15 req/min | 20K |
| Basic | $29/mo | 30 req/min | 20K |
| Standard | $79/mo | 80 req/min | 500K |
| Advanced | $299/mo | 300 req/min | 1.5M |
| Professional | $699/mo | 1200 req/min | 3.5M |

Get your API key at [aicoin.com/opendata](https://www.aicoin.com/opendata).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT](LICENSE)
