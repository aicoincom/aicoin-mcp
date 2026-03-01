# AiCoin OpenData MCP Server

Crypto market data, news, and analytics via AiCoin Open API.

## Features

- 100+ data tools across 6 modules (coins, contents, markets, features, hyperliquid, guide)
- HmacSHA1 auto-signing for all API requests
- Covers real-time tickers, K-lines, news, whale tracking, liquidation data
- stdio transport for local MCP clients
- Built-in free tier key (IP rate-limited 10 req/min)

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
AICOIN_ACCESS_KEY_ID=your_access_key_id
AICOIN_ACCESS_SECRET=your_access_secret
```

## Local Development & Testing

使用 [MCP Inspector](https://github.com/modelcontextprotocol/inspector) 在浏览器中可视化测试所有工具，无需发布 npm 或重装。

```bash
npm run build
AICOIN_ACCESS_KEY_ID=your_access_key_id \
AICOIN_ACCESS_SECRET=your_access_secret \
npx @modelcontextprotocol/inspector node build/index.js
```

打开终端输出的 URL（默认 `http://localhost:6274`），在浏览器中选择工具、填参数、点 Run 即可看到返回结果。

日常开发流程：改代码 → `npm run build` → 刷新 Inspector 页面。

---

## Available Tools

### 一、币种数据 Coins — 14 tools

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `get_coin_list` | 获取支持的币种列表（默认 top 100） | coin_key, hash_key, cn_name, en_name | `GET /v2/coin` |
| `get_coin_ticker` | 实时行情数据 | 价格、24h/7d 涨跌幅（CNY/USD）、市值、成交量、净流入 | `GET /v2/coin/ticker` |
| `get_coin_config` | 币种简介/描述信息 | 币种介绍、logo 等配置信息 | `GET /v2/coin/config` |
| `get_ai_coin_analysis` | AI 解读与预测 | price, degree(涨跌幅%), interpret(解读文本), trend(rise/fall), predition(预测) | `POST /v2/content/ai-coins` |
| `get_funding_rate_history` | 资金费率历史 | 各交易所各时间段的资金费率 | `GET /upgrade/v2/futures/funding-rate/history` |
| `get_weighted_funding_rate_history` | 成交量加权资金费率历史 | 按成交量加权后的综合资金费率 | `GET /upgrade/v2/futures/funding-rate/vol-weight-history` |
| `get_liquidation_map` | 爆仓热力图 | 不同价格区间的预估爆仓量（按杠杆倍数/周期） | `GET /upgrade/v2/futures/liquidation/map` |
| `get_liquidation_history` | 爆仓订单历史 | 各时间段多空爆仓金额 | `GET /upgrade/v2/futures/liquidation/history` |
| `get_estimated_liquidation_history` | 预估爆仓历史图表 | 历史爆仓趋势数据（按杠杆/周期） | `GET /upgrade/v2/futures/estimated-liquidation/history` |
| `get_aggregated_stablecoin_oi_history` | 稳定币合约持仓量历史 | 聚合后的 U 本位合约 OI 时序数据 | `GET /upgrade/v2/futures/open-interest/aggregated-stablecoin-history` |
| `get_aggregated_coin_margin_oi_history` | 币本位合约持仓量历史 | 聚合后的币本位合约 OI 时序数据 | `GET /upgrade/v2/futures/open-interest/aggregated-coin-margin-history` |
| `get_historical_depth` | 历史订单簿深度 | 历史盘口 bids/asks 数据 | `GET /upgrade/v2/futures/historical-depth` |
| `get_super_depth_history` | 大额深度历史（USD 阈值过滤） | 超过指定金额的大单深度历史 | `GET /upgrade/v2/futures/super-depth/history` |
| `get_trade_data` | 期货最新成交数据 | 逐笔成交明细 | `GET /upgrade/v2/futures/trade-data` |

### 二、资讯内容 Contents — 6 tools

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `get_newsflash` | AiCoin 快讯 | id, title, content, createtime（仅 AiCoin 自有快讯） | `GET /v2/content/newsflash` |
| `get_flash_list` | 行业快讯 | flashType(0-28 分类：价格变动/爆仓/CME 等), 内容, 时间 | `GET /v2/content/flashList` |
| `get_news_list` | 新闻列表 | id, title, describe, cover, createtime, language | `GET /v2/content/news-list` |
| `get_news_detail` | 新闻全文 | 完整文章内容 | `GET /v2/content/news-detail` |
| `get_rss_news_list` | RSS 新闻列表 | title, description, image, pubDate | `GET /v2/content/square/market/news-list` |
| `get_exchange_listing_flash` | 交易所上下币公告 | 上币/下币动态（默认追踪 Binance/Bitget） | `GET /v2/content/exchange-listing-flash` |

### 三、行情数据 Markets — 22 tools

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `get_kline_data` | K线数据 | OHLCV（开高低收量），支持 15m/1h/4h/1d 等周期 | `GET /v2/commonKline/dataRecords` |
| `get_market_ticker` | 交易所平台行情 | 各交易所的交易对价格、成交量 | `GET /v2/market/ticker` |
| `get_markets` | 所有支持的交易所列表 | 交易所名称、标识 | `GET /v2/market` |
| `get_futures_interest` | 期货持仓量数据 | 各币种/平台的合约持仓金额 | `GET /v2/futures/interest` |
| `get_index_price` | 指数价格 | 指数实时价格（如恐慌贪婪指数） | `GET /v2/index/indexPrice` |
| `get_index_info` | 指数详情 | 指数描述、组成信息 | `GET /v2/index/indexInfo` |
| `get_index_list` | 所有可用指数列表 | 指数名称和标识 | `GET /v2/index/getIndex` |
| `get_hot_tab_coins` | 热门币种榜 | 按分类（GameFi/DeFi/Web3/新币等）的热门币列表 | `GET /v2/market/hotTabCoins` |
| `get_crypto_stock_quotes` | 加密概念股行情 | ticker, company_name, last_price, 涨跌幅, 成交量, 市值 | `GET /upgrade/v2/crypto_stock/quotes` |
| `get_crypto_stock_top_gainer` | 加密概念股涨幅榜 | 美股/港股中涨幅最大的加密概念股 | `GET /upgrade/v2/crypto_stock/top-gainer` |
| `get_crypto_company_info` | 加密概念股公司详情 | 公司名、FDV、市值、年度高低点、公告 | `GET /upgrade/v2/crypto_stock/company/{symbol}` |
| `get_indicator_kline_trading_pair` | 指标 K 线交易对列表 | 支持某指标的交易对（fundflow/资金流/fr 等） | `GET /v2/indicatorKline/getTradingPair` |
| `get_indicator_kline_data` | 指标 K 线数据 | 附带指标值的 K 线数据 | `GET /v2/indicatorKline/dataRecords` |
| `get_coin_treasury_entities` | 机构持币实体 | 持币公司/机构列表（如 MicroStrategy） | `POST /upgrade/v2/coin-treasuries/entities` |
| `get_coin_treasury_history` | 机构持币历史 | 买入/卖出记录、数量、价格、时间 | `POST /upgrade/v2/coin-treasuries/history` |
| `get_coin_treasury_accumulated` | 机构累计持币历史 | 按日/周/月聚合的累计持仓变化 | `POST /upgrade/v2/coin-treasuries/history/accumulated` |
| `get_latest_coin_treasury_entities` | 最新机构持币实体 | 最新的持币机构列表 | `GET /upgrade/v2/coin-treasuries/latest/entities` |
| `get_latest_coin_treasury_history` | 最新机构持币记录 | 最近的买入/卖出操作 | `GET /upgrade/v2/coin-treasuries/latest/history` |
| `get_coin_treasury_summary` | 机构持币汇总 | 总持仓量、总价值等汇总统计 | `GET /upgrade/v2/coin-treasuries/summary` |
| `get_latest_depth` | 最新盘口深度（Redis 缓存） | 实时 bids/asks 数据 | `GET /upgrade/v2/futures/latest-depth` |
| `get_full_depth` | 完整盘口深度 | 全量订单簿 | `GET /upgrade/v2/futures/full-depth` |
| `get_full_depth_grouped` | 分组盘口深度 | 按价格区间（100/500/1000）聚合的深度 | `GET /upgrade/v2/futures/full-depth/grouped` |

### 四、特色功能 Features — 18 tools

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `get_ls_ratio` | 多空比 | 当前、1 天前、1 周前的多空比数据 | `GET /v2/mix/ls-ratio` |
| `get_liquidation_data` | 爆仓数据 | 按币种或平台维度的爆仓金额 | `GET /v2/mix/liq` |
| `get_big_orders` | 大单追踪 | 鲸鱼大单买卖方向、金额、价格 | `GET /v2/order/bigOrder` |
| `get_agg_trades` | 聚合大单 | 大额成交聚合统计 | `GET /v2/order/aggTrade` |
| `get_trading_pair_ticker` | 交易对行情 | 指定交易对的实时行情 | `GET /v2/trading-pair/ticker` |
| `get_strategy_signal` | 指标胜率信号 | 各策略信号的胜率统计（depth_win 等） | `GET /v2/signal/strategySignal` |
| `get_nav` | 导航栏数据（市场概览） | 主要交易对价格和行情信息 | `GET /v2/mix/nav` |
| `get_grayscale_trust` | 灰度信托数据 | GBTC 等信托基金的 last/open/high/low/涨跌幅 | `GET /v2/mix/grayscale-trust` |
| `get_gray_scale` | 灰度持仓数据 | 各币种的灰度持仓量 | `GET /v2/mix/gray-scale` |
| `get_stock_market` | 加密相关股票行情 | 上市公司股价数据 | `GET /v2/mix/stock-market` |
| `get_signal_alert` | 信号预警 | 当前触发的预警信号列表 | `GET /v2/signal/signalAlert` |
| `get_signal_alert_config` | 信号预警配置 | 可用的预警类型和配置选项 | `GET /v2/signal/signalAlertConf` |
| `get_signal_alert_list` | 预警设置列表 | 用户已设置的预警规则 | `GET /v2/signal/getSignalAlertSetList` |
| `add_signal_alert` | 添加信号预警 | 创建结果 | `GET /v2/signal/addSignalAlert` |
| `delete_signal_alert` | 删除信号预警 | 删除结果 | `GET /v2/signal/delSignalAlert` |
| `get_change_signal` | 异动信号 | type 1-24 种异动类型（价格突变、成交放量等） | `GET /v2/signal/changeSignal` |
| `get_trading_pair` | 交易所交易对 | 某交易所下的交易对信息 | `GET /v2/trading-pair/getTradingPair` |
| `get_trading_pairs` | 交易对列表 | 含展示参数的交易对列表 | `GET /v2/trading-pair` |

### 五、Hyperliquid 专属 — 42 tools

#### 行情 & 清算

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_get_tickers` | HL 全部 Ticker（前 50） | 全币种实时行情数据 | `GET /upgrade/v2/hl/tickers` |
| `hl_get_ticker_by_coin` | 指定币种 Ticker | 单币种行情详情 | `GET /upgrade/v2/hl/tickers/coin/{coin}` |
| `hl_get_liquidations` | 清算历史 | 历史清算记录列表 | `GET /upgrade/v2/hl/liquidations/history` |
| `hl_get_liquidation_stats` | 清算统计汇总 | 全市场清算统计 | `GET /upgrade/v2/hl/liquidations/stat` |
| `hl_get_liquidation_stats_by_coin` | 按币种清算统计 | 指定币种的清算统计数据 | `GET /upgrade/v2/hl/liquidations/stat-by-coin` |
| `hl_get_liquidation_top_positions` | 被清算最大仓位 | 近期最大清算仓位列表 | `GET /upgrade/v2/hl/liquidations/top-positions` |

#### 鲸鱼追踪

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_get_whale_positions` | 鲸鱼持仓（按 USD 阈值过滤） | 大额持仓列表，含方向和仓位价值 | `GET /upgrade/v2/hl/whales/open-positions` |
| `hl_get_whale_events` | 最新鲸鱼动态事件 | 鲸鱼开仓/平仓/加仓事件流 | `GET /upgrade/v2/hl/whales/latest-events` |
| `hl_get_whale_directions` | 鲸鱼多空方向统计 | 多头/空头鲸鱼数量统计 | `GET /upgrade/v2/hl/whales/directions` |
| `hl_get_whale_history_long_ratio` | 鲸鱼历史多空比 | 历史多空比时序数据 | `GET /upgrade/v2/hl/whales/history-long-ratio` |

#### 持仓量 (Open Interest)

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_get_oi_summary` | 全市场持仓量汇总 | positionCount, longPv, shortPv, totalPv, avgPv | `GET /upgrade/v2/hl/open-interest/summary` |
| `hl_get_oi_top_coins` | 头部币种持仓量排名 | 按 totalPv 排序的各币种持仓统计 | `GET /upgrade/v2/hl/open-interest/top-coins` |
| `hl_get_oi_history` | 指定币种持仓量历史 | time, positionCount, longCount, longPv, totalPv, avgPv | `GET /upgrade/v2/hl/open-interest/history/{coin}` |

#### 主动买卖

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_get_accumulated_taker_delta` | 主动买卖累计差值 | szDelta(数量差值), valDelta(价值差值) | `GET /upgrade/v2/hl/accumulated-taker-delta/{coin}` |
| `hl_get_klines_with_taker_vol` | K 线 + Taker 买卖量 | K 线数据附带主动买卖量 | `GET /upgrade/v2/hl/klines-with-taker-vol/{coin}/{interval}` |

#### 交易者分析

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_get_trader_stats` | 交易者统计 | 胜率、盈亏、交易次数等 | `GET /upgrade/v2/hl/traders/{address}/addr-stat` |
| `hl_get_traders_accounts` | 批量查询账户信息 | 多地址账户详情 | `POST /upgrade/v2/hl/traders/accounts` |
| `hl_get_traders_statistics` | 批量查询交易统计 | 多地址统计数据 | `POST /upgrade/v2/hl/traders/statistics` |
| `hl_get_best_trades` | 最赚钱的交易记录 | 指定周期内盈利最高的交易 | `GET /upgrade/v2/hl/traders/{address}/best-trades` |
| `hl_get_performance_by_coin` | 按币种绩效分析 | 各币种的胜率、盈亏统计 | `GET /upgrade/v2/hl/traders/{address}/performance-by-coin` |

#### 成交 & 订单

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_get_fills_by_address` | 按地址查成交 | 成交记录列表 | `GET /upgrade/v2/hl/fills/{address}` |
| `hl_get_fills_by_oid` | 按订单 ID 查成交 | 指定订单的成交明细 | `GET /upgrade/v2/hl/fills/oid/{oid}` |
| `hl_get_fills_by_twapid` | 按 TWAP ID 查成交 | TWAP 订单成交明细 | `GET /upgrade/v2/hl/fills/twapid/{twapid}` |
| `hl_get_top_trades` | 热门大额成交 | 近期最大成交记录 | `GET /upgrade/v2/hl/fills/top-trades` |
| `hl_get_filled_orders` | 已成交订单 | 已成交订单列表 | `GET /upgrade/v2/hl/filled-orders/{address}/latest` |
| `hl_get_filled_order_by_oid` | 按 OID 查已成交订单 | 单笔已成交订单详情 | `GET /upgrade/v2/hl/filled-orders/oid/{oid}` |
| `hl_get_completed_trades` | 已完成交易列表 | 已平仓交易列表 | `GET /upgrade/v2/hl/traders/{address}/completed-trades` |
| `hl_get_orders` | 最新订单 | 挂单/历史订单列表 | `GET /upgrade/v2/hl/orders/{address}/latest` |
| `hl_get_order_by_oid` | 按 OID 查订单 | 单笔订单详情 | `GET /upgrade/v2/hl/orders/oid/{oid}` |
| `hl_get_top_open_orders` | 最大挂单 | 当前最大未成交挂单 | `GET /upgrade/v2/hl/orders/top-open-orders` |
| `hl_get_active_stats` | 活跃订单统计 | 活跃订单数量和金额统计 | `GET /upgrade/v2/hl/orders/active-stats` |
| `hl_get_twap_states` | TWAP 订单状态 | TWAP 算法订单执行状态 | `GET /upgrade/v2/hl/twap-states/{address}/latest` |

#### 持仓 & 盈亏

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_get_current_position_history` | 当前持仓历史 | 当前未平仓位的历史变化 | `GET /upgrade/v2/hl/traders/{address}/current-position-history/{coin}` |
| `hl_get_completed_position_history` | 已平仓位历史 | 已平仓位的完整历史 | `GET /upgrade/v2/hl/traders/{address}/completed-position-history/{coin}` |
| `hl_get_current_position_pnl` | 当前持仓盈亏曲线 | 当前仓位的 PnL 时序 | `GET /upgrade/v2/hl/traders/{address}/current-position-pnl/{coin}` |
| `hl_get_completed_position_pnl` | 已平仓位盈亏曲线 | 已平仓位的 PnL 时序 | `GET /upgrade/v2/hl/traders/{address}/completed-position-pnl/{coin}` |
| `hl_get_current_position_executions` | 当前持仓执行轨迹 | 当前仓位的逐笔执行记录 | `GET /upgrade/v2/hl/traders/{address}/current-position-executions/{coin}` |
| `hl_get_completed_position_executions` | 已平仓位执行轨迹 | 已平仓位的逐笔执行记录 | `GET /upgrade/v2/hl/traders/{address}/completed-position-executions/{coin}` |

#### 组合 & 风控

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_get_portfolio` | 账户权益和 PNL 曲线 | 账户价值时序数据 | `GET /upgrade/v2/hl/portfolio/{address}/{window}` |
| `hl_get_pnls` | 盈亏曲线 | 盈亏时序数据 | `GET /upgrade/v2/hl/pnls/{address}` |
| `hl_get_max_drawdown` | 最大回撤 | 历史最大回撤值和时间 | `GET /upgrade/v2/hl/max-drawdown/{address}` |
| `hl_get_net_flow` | 账户净流入流出 | 充提净流水 | `GET /upgrade/v2/hl/ledger-updates/net-flow/{address}` |

#### 发现 & 高级查询

| 工具名 | 作用 | 返回数据含义 | API |
|--------|------|-------------|-----|
| `hl_info` | 通用 Info API | 支持 metaAndAssetCtxs/clearinghouseState/l2Book 等多种类型查询 | `POST /upgrade/v2/hl/info` |
| `hl_smart_find` | Smart Money 地址发现 | 符合条件的聪明钱地址列表 | `POST /upgrade/v2/hl/smart/find` |
| `hl_discover_traders` | 按条件筛选交易者 | 符合筛选条件的交易者列表 | `POST /upgrade/v2/hl/traders/discover` |

### 六、引导工具 Guide — 3 tools

| 工具名 | 作用 | 触发条件 |
|--------|------|---------|
| `guide_get_api_key` | 引导用户注册 AiCoin 并生成 OpenAPI Key | API 返回 401/403 时自动触发 |
| `guide_upgrade_tier` | 引导升级 API 套餐（含套餐对比表） | API 返回 403 或功能受限时 |
| `guide_setup_ccxt_trade` | 引导配置 Trade MCP（CCXT 交易执行） | 用户需要交易功能时 |

---

## API Tiers

| Tier | Price | Rate Limit |
|------|-------|-----------|
| Basic (Free) | Free | 10 req/min |
| Normal | ¥99/mo | 60 req/min |
| Premium | ¥299/mo | 120 req/min |
| Professional | ¥999/mo | 300 req/min |

- `/v2/*` endpoints are available on all tiers
- `/upgrade/v2/*` endpoints may require paid tiers

---

## Client Configuration

> Get your API credentials at [AiCoin OpenAPI](https://www.aicoin.com/opendata)

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aicoin-opendata": {
      "command": "npx",
      "args": ["-y", "@aicoin/opendata-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "your_access_key_id",
        "AICOIN_ACCESS_SECRET": "your_access_secret"
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
        "AICOIN_ACCESS_KEY_ID": "your_access_key_id",
        "AICOIN_ACCESS_SECRET": "your_access_secret"
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
        "AICOIN_ACCESS_KEY_ID": "your_access_key_id",
        "AICOIN_ACCESS_SECRET": "your_access_secret"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add aicoin-opendata -- npx -y @aicoin/opendata-mcp
```
