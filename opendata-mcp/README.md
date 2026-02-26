# AiCoin OpenData MCP Server

Crypto market data, news, and analytics via AiCoin Open API.

## Features

- 100+ data tools across 5 modules (coins, contents, markets, features, hyperliquid)
- HmacSHA1 auto-signing for all API requests
- Covers real-time tickers, K-lines, news, whale tracking, liquidation data
- stdio transport for local MCP clients

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your AiCoin API credentials
npm run build
npm start
```

## Environment Variables

```bash
AICOIN_ACCESS_KEY=your_access_key_id
AICOIN_ACCESS_SECRET=your_access_secret
```

## Available Tools

### Coins

| Tool | Description |
|------|-------------|
| `get_coin_list` | All supported coins |
| `get_coin_ticker` | Real-time price, change, volume |
| `get_coin_config` | Coin profile/description |
| `get_ai_coin_analysis` | AI interpretation and prediction |
| `get_funding_rate_history` | Funding rate history |
| `get_liquidation_map` | Liquidation heatmap |
| `get_weighted_funding_rate_history` | Volume-weighted funding rate history |
| `get_aggregated_stablecoin_oi_history` | Aggregated stablecoin OI history |
| `get_aggregated_coin_margin_oi_history` | Aggregated coin-margin OI history |
| `get_liquidation_history` | Liquidation order history |
| `get_estimated_liquidation_history` | Estimated liquidation chart data |
| `get_historical_depth` | Historical order book depth |
| `get_super_depth_history` | Large order depth history |
| `get_trade_data` | Latest futures trade data |

### Contents

| Tool | Description |
|------|-------------|
| `get_newsflash` | Flash news (kuaixun) |
| `get_news_list` | News article list |
| `get_news_detail` | Full article content |
| `get_rss_news_list` | RSS news feed |
| `get_flash_list` | Industry flash news with classification |
| `get_exchange_listing_flash` | Exchange listing/delisting news |

### Markets

| Tool | Description |
|------|-------------|
| `get_kline_data` | K-line/candlestick data |
| `get_market_ticker` | Exchange platform ticker |
| `get_markets` | All exchange platforms |
| `get_futures_interest` | Futures open interest |
| `get_crypto_stock_quotes` | Crypto stock quotes (MSTR, COIN) |
| `get_index_price` | Index price data |
| `get_hot_tab_coins` | Trending coins by category |
| `get_crypto_company_info` | Crypto company details by symbol |
| `get_index_info` | Index detail information |
| `get_index_list` | All available indexes |
| `get_indicator_kline_trading_pair` | Trading pairs for indicator K-line |
| `get_indicator_kline_data` | Indicator K-line data records |
| `get_coin_treasury_entities` | Coin treasury entity data |
| `get_coin_treasury_history` | Coin treasury historical data |
| `get_coin_treasury_accumulated` | Accumulated treasury history |
| `get_latest_coin_treasury_entities` | Latest treasury entities |
| `get_latest_coin_treasury_history` | Latest treasury history |
| `get_coin_treasury_summary` | Treasury data summary |
| `get_latest_depth` | Latest order book depth |
| `get_full_depth` | Full order book depth |
| `get_full_depth_grouped` | Full depth grouped by price |

### Features

| Tool | Description |
|------|-------------|
| `get_ls_ratio` | Long/short ratio |
| `get_liquidation_data` | Liquidation/forced-close data |
| `get_big_orders` | Whale order tracking |
| `get_agg_trades` | Aggregated large trades |
| `get_trading_pair_ticker` | Trading pair ticker data |
| `get_strategy_signal` | Indicator win-rate signals |
| `get_nav` | Market overview navigation data |
| `get_grayscale_trust` | Grayscale trust fund data |
| `get_gray_scale` | Grayscale holdings data |
| `get_stock_market` | Crypto-related stock market data |
| `get_signal_alert` | Signal alert data |
| `get_signal_alert_config` | Signal alert config options |
| `delete_signal_alert` | Delete signal alert by ID |
| `add_signal_alert` | Add new signal alert |
| `get_signal_alert_list` | Signal alert settings list |
| `get_change_signal` | Abnormal movement signals |
| `get_trading_pair` | Trading pair info by key |
| `get_trading_pairs` | Trading pair list for platform |

### Hyperliquid

| Tool | Description |
|------|-------------|
| `hl_get_tickers` | All Hyperliquid tickers |
| `hl_get_ticker_by_coin` | Ticker for specific coin |
| `hl_get_whale_positions` | Whale open positions |
| `hl_get_liquidations` | Liquidation history |
| `hl_get_trader_stats` | Trader statistics by address |
| `hl_info` | Generic Info API (all info types) |
| `hl_get_fills_by_address` | Trade fills by wallet address |
| `hl_get_fills_by_oid` | Trade fills by order ID |
| `hl_get_fills_by_twapid` | Trade fills by TWAP ID |
| `hl_get_top_trades` | Top trades |
| `hl_get_filled_orders` | Filled orders by address |
| `hl_get_filled_order_by_oid` | Filled order by order ID |
| `hl_get_orders` | Latest orders by address |
| `hl_get_order_by_oid` | Order by order ID |
| `hl_get_top_open_orders` | Top open orders |
| `hl_get_active_stats` | Active order statistics |
| `hl_get_portfolio` | Account value and PNL curves |
| `hl_get_pnls` | PNL curve data by address |
| `hl_get_best_trades` | Most profitable trades |
| `hl_get_performance_by_coin` | Per-coin trading performance |
| `hl_get_completed_trades` | Completed trades list |
| `hl_get_current_position_history` | Current position history |
| `hl_get_completed_position_history` | Completed position history |
| `hl_get_current_position_pnl` | Current position PnL |
| `hl_get_completed_position_pnl` | Completed position PnL |
| `hl_get_current_position_executions` | Current position executions |
| `hl_get_completed_position_executions` | Completed position executions |
| `hl_get_traders_accounts` | Batch trader account info |
| `hl_get_traders_statistics` | Batch trader statistics |
| `hl_get_whale_events` | Latest whale position events |
| `hl_get_whale_directions` | Whale long/short counts |
| `hl_get_whale_history_long_ratio` | Historical whale long/short ratio |
| `hl_get_liquidation_stats` | Liquidation statistics |
| `hl_get_liquidation_stats_by_coin` | Liquidation stats by coin |
| `hl_get_liquidation_top_positions` | Top liquidated positions |
| `hl_smart_find` | Discover smart money addresses |
| `hl_discover_traders` | Discover traders by criteria |
| `hl_get_twap_states` | TWAP order states |
| `hl_get_max_drawdown` | Max drawdown by address |
| `hl_get_net_flow` | Ledger net flow by address |
| `hl_get_klines_with_taker_vol` | K-lines with taker volume |

## Client Configuration

> **Note:** AiCoin 后台字段名和环境变量是反的：
> - 后台 `api_key` → `AICOIN_ACCESS_KEY`
> - 后台 `access_key` → `AICOIN_ACCESS_SECRET`

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aicoin-opendata": {
      "command": "npx",
      "args": ["-y", "@aicoin/opendata-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY": "your_api_key_from_aicoin",
        "AICOIN_ACCESS_SECRET": "your_access_key_from_aicoin"
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
    "aicoin-opendata": {
      "command": "npx",
      "args": ["-y", "@aicoin/opendata-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY": "your_api_key_from_aicoin",
        "AICOIN_ACCESS_SECRET": "your_access_key_from_aicoin"
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
    "aicoin-opendata": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@aicoin/opendata-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY": "your_api_key_from_aicoin",
        "AICOIN_ACCESS_SECRET": "your_access_key_from_aicoin"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add aicoin-opendata -- npx -y @aicoin/opendata-mcp
```
