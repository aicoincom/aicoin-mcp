# @aicoin/aicoin-mcp

AiCoin MCP Server — connect any AI assistant to real-time crypto market data and exchange trading.

**41 tools** covering market data, K-lines, funding rates, liquidations, order flow, Hyperliquid analytics, news, and multi-exchange trading via CCXT.

## Quick Start

### 1. Get your API Key

Visit [aicoin.com/opendata](https://www.aicoin.com/opendata) to create a free API key.

### 2. Add to your MCP client

**Claude Desktop / Cursor / Windsurf** — edit your MCP config:

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

**Claude Code** — add to `.mcp.json` in your project root, same format as above.

That's it. Your AI assistant now has access to 41 crypto data tools.

### 3. (Optional) Enable exchange trading

To place orders, check balances, etc., add your exchange API key:

```json
{
  "mcpServers": {
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/aicoin-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "your-key-id",
        "AICOIN_ACCESS_SECRET": "your-secret",
        "DEFAULT_EXCHANGE": "okx",
        "OKX_API_KEY": "your-exchange-api-key",
        "OKX_SECRET": "your-exchange-secret",
        "OKX_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

Exchange API keys are stored locally only and never sent to AiCoin servers.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AICOIN_ACCESS_KEY_ID` | No | AiCoin API key (free tier built-in, rate-limited) |
| `AICOIN_ACCESS_SECRET` | No | AiCoin API secret |
| `DEFAULT_EXCHANGE` | No | Default exchange for trading (default: `binance`) |
| `{EXCHANGE}_API_KEY` | For trading | Exchange API key |
| `{EXCHANGE}_SECRET` | For trading | Exchange API secret |
| `{EXCHANGE}_PASSPHRASE` | OKX/Bitget | Exchange passphrase |
| `USE_PROXY` | No | Enable proxy (`true`/`false`) |
| `PROXY_URL` | No | Proxy URL, e.g. `http://127.0.0.1:7890` |

Supported exchanges: `binance` `binanceusdm` `binancecoinm` `okx` `bybit` `bitget` `gate` `huobi` `hyperliquid`

## Tools

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
| `signal_manage` | Create and delete signal alerts |
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

### Exchange Trading (11 tools, requires exchange API key)

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

## API Tiers

| Tier | Price | Rate Limit | Features |
|------|-------|------------|----------|
| Basic | Free | 10 req/min | Market data, news, K-lines, indexes |
| Normal | ¥99/mo | 60 req/min | + Funding rate, liquidation, OI |
| Premium | ¥299/mo | 120 req/min | + Depth, whale tracking, order flow |
| Professional | ¥999/mo | 300 req/min | + Full depth, all features |

Upgrade at [aicoin.com/opendata](https://www.aicoin.com/opendata). Your existing key is automatically upgraded.

## License

MIT
