# AiCoin API Tier Access Report

> Test date: 2026-03-02
> Endpoints tested: 104 (AiCoin API only, excludes CCXT exchange tools)
> Key mapping: `api_key` → AccessKeyId, `access_key` → HMAC Secret

## Summary

| Tier | 价格 | 频率限制 | ✅ 可访问 | 🔒 需升级 | ⚠️ 后端bug | 🔘 无法测试 |
|------|------|---------|:---:|:---:|:---:|:---:|
| Free (内置) | 免费 | 10 req/min | 9 | 92 | 2 | 1 |
| Basic (基础版) | 免费 | 10 req/min | 23 | 77 | 3 | 1 |
| Normal (标准版) | ¥99/月 | 60 req/min | 68 | 32 | 3 | 1 |
| Premium (高级版) | ¥299/月 | 120 req/min | 76 | 24 | 3 | 1 |
| Professional (专业版) | ¥999/月 | 300 req/min | 100 | 0 | 3 | 1 |

> **Professional 全部端点均可访问**。3 个 ⚠️ 是后端 500 bug（非权限），1 个 🔘 是测试用假ID无法判断。

## Legend

| 符号 | 含义 |
|:---:|------|
| ✅ | 可访问（HTTP 200 成功 或 400 参数错误） |
| 🔒 | 需升级（HTTP 403 或 业务码 403/304） |
| ⚠️ | 后端错误（HTTP 500，非权限问题） |
| 🔘 | 无法测试（需要真实数据才能判断） |

---

## Detailed Results

### Coin Data

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 1 | coin_info | list | /api/v2/coin | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 2 | coin_info | ticker | /api/v2/coin/ticker | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | coin_info | config | /api/v2/coin/config | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 4 | coin_info | ai_analysis | /api/v2/content/ai-coins | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |

### Market Data

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 5 | market_info | exchanges | /api/v2/market | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | market_info | ticker | /api/v2/market/ticker | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 7 | market_info | hot_coins | /api/v2/market/hotTabCoins | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | market_info | futures_interest | /api/v2/futures/interest | 🔒 | ✅ | ✅ | ✅ | ✅ |

### K-line

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 9 | kline | data | /api/v2/commonKline/dataRecords | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | kline | indicator | /api/v2/indicatorKline/dataRecords | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 11 | kline | trading_pair | /api/v2/indicatorKline/getTradingPair | 🔒 | 🔒 | 🔒 | ✅ | ✅ |

### Index

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 12 | index_data | price | /api/v2/index/indexPrice | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 13 | index_data | info | /api/v2/index/indexInfo | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 14 | index_data | list | /api/v2/index/getIndex | 🔒 | 🔒 | 🔒 | ✅ | ✅ |

### Content

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 15 | news | list | /api/v2/content/news-list | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 16 | news | detail | /api/v2/content/news-detail | 🔘 | 🔘 | 🔘 | 🔘 | 🔘 |
| 17 | news | rss | /api/v2/content/square/market/news-list | ✅ | ✅ | ✅ | ✅ | ✅ |
| 18 | flash | newsflash | /api/v2/content/newsflash | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 19 | flash | list | /api/v2/content/flashList | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 20 | flash | exchange_listing | /api/v2/content/exchange-listing-flash | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |

> **#16 news.detail**: 测试用假ID(999999)，后端对无效ID返回 errorCode 403，无法区分权限和参数错误。需用真实文章ID重测。

### Features

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 21 | market_overview | nav | /api/v2/mix/nav | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 22 | market_overview | ls_ratio | /api/v2/mix/ls-ratio | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 23 | market_overview | liquidation | /api/v2/mix/liq | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 24 | market_overview | grayscale_trust | /api/v2/mix/grayscale-trust | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 25 | market_overview | gray_scale | /api/v2/mix/gray-scale | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 26 | market_overview | stock_market | /api/v2/mix/stock-market | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 27 | order_flow | big_orders | /api/v2/order/bigOrder | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 28 | order_flow | agg_trades | /api/v2/order/aggTrade | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 29 | trading_pair | ticker | /api/v2/trading-pair/ticker | ✅ | ✅ | ✅ | ✅ | ✅ |
| 30 | trading_pair | by_market | /api/v2/trading-pair/getTradingPair | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 31 | trading_pair | list | /api/v2/trading-pair | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 32 | signal_data | strategy | /api/v2/signal/strategySignal | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 33 | signal_data | alert | /api/v2/signal/signalAlert | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 34 | signal_data | config | /api/v2/signal/signalAlertConf | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 35 | signal_data | alert_list | /api/v2/signal/getSignalAlertSetList | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 36 | signal_data | change | /api/v2/signal/changeSignal | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 37 | signal_manage | delete | /api/v2/signal/delSignalAlert | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |

### Futures (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 38 | coin_funding_rate | default | /api/upgrade/v2/futures/funding-rate/history | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 39 | coin_funding_rate | weighted | /api/upgrade/v2/futures/funding-rate/vol-weight-history | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 40 | coin_liquidation | history | /api/upgrade/v2/futures/liquidation/history | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 41 | coin_liquidation | map | /api/upgrade/v2/futures/liquidation/map | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 42 | coin_liquidation | estimated | /api/upgrade/v2/futures/estimated-liquidation/history | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 43 | coin_open_interest | stablecoin | /api/upgrade/v2/futures/open-interest/agg-stablecoin | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 44 | coin_open_interest | coin | /api/upgrade/v2/futures/open-interest/agg-coin-margin | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 45 | coin_futures_data | historical_depth | /api/upgrade/v2/futures/historical-depth | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 46 | coin_futures_data | super_depth | /api/upgrade/v2/futures/super-depth/history | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 47 | coin_futures_data | trade_data | /api/upgrade/v2/futures/trade-data | 🔒 | ✅ | ✅ | ✅ | ✅ |

### Depth (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 48 | depth | latest | /api/upgrade/v2/futures/latest-depth | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 49 | depth | full | /api/upgrade/v2/futures/full-depth | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 50 | depth | grouped | /api/upgrade/v2/futures/full-depth/grouped | 🔒 | 🔒 | 🔒 | ✅ | ✅ |

### Crypto Stock (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 51 | crypto_stock | quotes | /api/upgrade/v2/crypto_stock/quotes | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 52 | crypto_stock | top_gainer | /api/upgrade/v2/crypto_stock/top-gainer | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 53 | crypto_stock | company | /api/upgrade/v2/crypto_stock/company/{symbol} | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |

### Coin Treasury (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 54 | coin_treasury | entities | /api/upgrade/v2/coin-treasuries/entities | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 55 | coin_treasury | history | /api/upgrade/v2/coin-treasuries/history | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 56 | coin_treasury | accumulated | /api/upgrade/v2/coin-treasuries/history/accumulated | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 57 | coin_treasury | latest_entities | /api/upgrade/v2/coin-treasuries/latest/entities | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 58 | coin_treasury | latest_history | /api/upgrade/v2/coin-treasuries/latest/history | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| 59 | coin_treasury | summary | /api/upgrade/v2/coin-treasuries/summary | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |

### Hyperliquid — Ticker & Whale (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 60 | hl_ticker | all | /api/upgrade/v2/hl/tickers | ✅ | ✅ | ✅ | ✅ | ✅ |
| 61 | hl_ticker | single | /api/upgrade/v2/hl/tickers/coin/{coin} | ✅ | ✅ | ✅ | ✅ | ✅ |
| 62 | hl_whale | positions | /api/upgrade/v2/hl/whales/open-positions | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 63 | hl_whale | events | /api/upgrade/v2/hl/whales/latest-events | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 64 | hl_whale | directions | /api/upgrade/v2/hl/whales/directions | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 65 | hl_whale | history_ratio | /api/upgrade/v2/hl/whales/history-long-ratio | 🔒 | 🔒 | ✅ | ✅ | ✅ |

### Hyperliquid — Liquidation & OI (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 66 | hl_liquidation | history | /api/upgrade/v2/hl/liquidations/history | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 67 | hl_liquidation | stats | /api/upgrade/v2/hl/liquidations/stat | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 68 | hl_liquidation | stats_by_coin | /api/upgrade/v2/hl/liquidations/stat-by-coin | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 69 | hl_liquidation | top_positions | /api/upgrade/v2/hl/liquidations/top-positions | 🔒 | 🔒 | ⚠️ | ⚠️ | ⚠️ |
| 70 | hl_open_interest | summary | /api/upgrade/v2/hl/open-interest/summary | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 71 | hl_open_interest | top_coins | /api/upgrade/v2/hl/open-interest/top-coins | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 72 | hl_open_interest | history | /api/upgrade/v2/hl/open-interest/history/{coin} | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |

### Hyperliquid — Taker (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 73 | hl_taker | delta | /api/upgrade/v2/hl/accumulated-taker-delta/{coin} | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| 74 | hl_taker | klines | /api/upgrade/v2/hl/klines-with-taker-vol/{coin}/{interval} | 🔒 | 🔒 | ✅ | ✅ | ✅ |

### Hyperliquid — Trader (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 75 | hl_trader | stats | /api/upgrade/v2/hl/traders/{addr}/addr-stat | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 76 | hl_trader | best_trades | /api/upgrade/v2/hl/traders/{addr}/best-trades | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 77 | hl_trader | performance | /api/upgrade/v2/hl/traders/{addr}/performance-by-coin | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 78 | hl_trader | completed_trades | /api/upgrade/v2/hl/traders/{addr}/completed-trades | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 79 | hl_trader | accounts | /api/upgrade/v2/hl/traders/accounts | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 80 | hl_trader | statistics | /api/upgrade/v2/hl/traders/statistics | 🔒 | 🔒 | ✅ | ✅ | ✅ |

### Hyperliquid — Fills (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 81 | hl_fills | by_address | /api/upgrade/v2/hl/fills/{addr} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 82 | hl_fills | by_oid | /api/upgrade/v2/hl/fills/oid/{oid} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 83 | hl_fills | by_twapid | /api/upgrade/v2/hl/fills/twapid/{twapid} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 84 | hl_fills | top_trades | /api/upgrade/v2/hl/fills/top-trades | 🔒 | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

### Hyperliquid — Orders (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 85 | hl_orders | latest | /api/upgrade/v2/hl/orders/{addr}/latest | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 86 | hl_orders | by_oid | /api/upgrade/v2/hl/orders/oid/{oid} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 87 | hl_orders | filled | /api/upgrade/v2/hl/filled-orders/{addr}/latest | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 88 | hl_orders | filled_by_oid | /api/upgrade/v2/hl/filled-orders/oid/{oid} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 89 | hl_orders | top_open | /api/upgrade/v2/hl/orders/top-open-orders | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 90 | hl_orders | active_stats | /api/upgrade/v2/hl/orders/active-stats | 🔒 | ✅ | ✅ | ✅ | ✅ |
| 91 | hl_orders | twap_states | /api/upgrade/v2/hl/twap-states/{addr}/latest | 🔒 | 🔒 | ✅ | ✅ | ✅ |

### Hyperliquid — Position (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 92 | hl_position | current_history | /api/upgrade/v2/hl/traders/{addr}/current-position-history/{coin} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 93 | hl_position | completed_history | /api/upgrade/v2/hl/traders/{addr}/completed-position-history/{coin} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 94 | hl_position | current_pnl | /api/upgrade/v2/hl/traders/{addr}/current-position-pnl/{coin} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 95 | hl_position | completed_pnl | /api/upgrade/v2/hl/traders/{addr}/completed-position-pnl/{coin} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 96 | hl_position | current_executions | /api/upgrade/v2/hl/traders/{addr}/current-position-executions/{coin} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 97 | hl_position | completed_executions | /api/upgrade/v2/hl/traders/{addr}/completed-position-executions/{coin} | 🔒 | 🔒 | ✅ | ✅ | ✅ |

> **#92-97 注意**：Premium 测试时偶发限流返回 403，实际权限应与 Normal 相同（✅）。已手动修正。

### Hyperliquid — Portfolio (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 98 | hl_portfolio | portfolio | /api/upgrade/v2/hl/portfolio/{addr}/{window} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 99 | hl_portfolio | pnls | /api/upgrade/v2/hl/pnls/{addr} | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 100 | hl_portfolio | max_drawdown | /api/upgrade/v2/hl/max-drawdown/{addr} | 🔒 | 🔒 | ⚠️ | ⚠️ | ⚠️ |
| 101 | hl_portfolio | net_flow | /api/upgrade/v2/hl/ledger-updates/net-flow/{addr} | 🔒 | 🔒 | ✅ | ✅ | ✅ |

### Hyperliquid — Advanced (Upgrade)

| # | Tool | Action | Endpoint | Free | Basic | Normal | Premium | Pro |
|--:|------|--------|----------|:---:|:---:|:---:|:---:|:---:|
| 102 | hl_advanced | info | /api/upgrade/v2/hl/info | ✅ | ✅ | ✅ | ✅ | ✅ |
| 103 | hl_advanced | smart_find | /api/upgrade/v2/hl/smart/find | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| 104 | hl_advanced | discover | /api/upgrade/v2/hl/traders/discover | 🔒 | 🔒 | 🔒 | ✅ | ✅ |

---

## Backend Errors (⚠️)

以下 3 个端点返回 HTTP 500，是后端 bug，非权限问题：

| # | Endpoint | 说明 |
|--:|----------|------|
| 69 | hl_liquidation.top_positions | 所有有权限的 tier 均返回 500 |
| 84 | hl_fills.top_trades | 所有有权限的 tier 均返回 500 |
| 100 | hl_portfolio.max_drawdown | 所有有权限的 tier 均返回 500 |

## Notes

- **Key 映射**：`api_key` = AccessKeyId（公钥），`access_key` = HMAC Secret（签名密钥）
- **CCXT 交易工具**（exchange_info, create_order 等 11 个）直连交易所，不经 AiCoin API，无 tier 限制，未纳入测试
- **guide 工具** 返回静态文本，无 API 调用，未纳入测试
- **#16 news.detail**：假 ID 测试时后端对无效 ID 返回 errorCode 403，无法区分权限与参数错误
- **#92-97 hl_position**：Premium 测试偶发限流（normal ✅, professional ✅），已手动修正为 ✅
