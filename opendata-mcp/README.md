# @aicoin/opendata-mcp

AiCoin OpenData MCP Server — real-time crypto market data & analytics for any AI assistant.

**30 tools** · Market data · K-lines · Funding rates · Liquidations · Order flow · Hyperliquid analytics · News

> Need exchange trading (place orders, check balances)? Use [@aicoin/aicoin-mcp](https://www.npmjs.com/package/@aicoin/aicoin-mcp) instead — it includes everything here plus 11 CCXT trading tools.

## Quick Start

Works out of the box — a free API key is built in (10 req/min, IP rate-limited).

### Claude Code

```bash
claude mcp add aicoin-opendata -- npx -y @aicoin/opendata-mcp
```

### Other Clients

Add to your MCP config (`.mcp.json`, `claude_desktop_config.json`, etc.):

```json
{
  "mcpServers": {
    "aicoin-opendata": {
      "command": "npx",
      "args": ["-y", "@aicoin/opendata-mcp"]
    }
  }
}
```

### Use Your Own API Key (Optional)

For higher rate limits, get a key at [aicoin.com/opendata](https://www.aicoin.com/opendata) and add env vars:

```json
{
  "mcpServers": {
    "aicoin-opendata": {
      "command": "npx",
      "args": ["-y", "@aicoin/opendata-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "your-key-id",
        "AICOIN_ACCESS_SECRET": "your-secret"
      }
    }
  }
}
```

## Tools

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
| `signal_manage` | Add or delete signal alerts |
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
| `guide` | Setup guides for API key and tier upgrade |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AICOIN_ACCESS_KEY_ID` | No | AiCoin API key (free tier built-in, rate-limited) |
| `AICOIN_ACCESS_SECRET` | No | AiCoin API secret |

## API Tiers

| Tier | Price | Rate Limit | Features |
|------|-------|------------|----------|
| Basic | Free | 10 req/min | Market data, news, K-lines, indexes |
| Normal | ¥99/mo | 60 req/min | + Funding rate, liquidation, OI |
| Premium | ¥299/mo | 120 req/min | + Depth, whale tracking, order flow |
| Professional | ¥999/mo | 300 req/min | + Full depth, all features |

Upgrade at [aicoin.com/opendata](https://www.aicoin.com/opendata). Your existing key is automatically upgraded.

## Migrating from v1.x

v2.0 consolidates 100+ individual tools into **30 action-based tools**. Each tool now supports multiple actions via an `action` parameter (e.g., `coin_info` with `action: "list"` / `"ticker"` / `"config"` / `"ai_analysis"`).

This reduces context overhead for AI assistants and improves tool selection accuracy. All API endpoints remain the same — only the tool interface changed.

## License

MIT
