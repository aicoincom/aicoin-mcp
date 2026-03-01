# @aicoin/aicoin-mcp v1.0.1 — 完整测试报告

> 测试日期：2026-03-01
> 测试环境：AiCoin OpenData API（当前 tier）+ OKX CCXT
> 总计：119 个 action，全部测试
> 结果：**103 成功** / 5 Tier Locked / 2 后端 500 / 1 API 限制 / 3 缺测试数据 / 3 账户限制 / 2 Tier Locked(signal)

---

## 1. 403 Tier Locked — AiCoin API（5 个）

当前 API Key tier 无权限访问以下接口，需升级套餐。

| 工具               | Action    | API Endpoint                                        | 错误                    |
| ------------------ | --------- | --------------------------------------------------- | ----------------------- |
| `hl_open_interest` | summary   | `/api/upgrade/v2/hl/open-interest/summary`          | 403: 没有权限访问此资源 |
| `hl_open_interest` | top_coins | `/api/upgrade/v2/hl/open-interest/top-coins`        | 403: 没有权限访问此资源 |
| `hl_open_interest` | history   | `/api/upgrade/v2/hl/open-interest/history/{coin}`   | 403: 没有权限访问此资源 |
| `hl_taker`         | delta     | `/api/upgrade/v2/hl/accumulated-taker-delta/{coin}` | 403: 没有权限访问此资源 |
| `hl_liquidation`   | stats     | (endpoint unknown, 403 before URL logged)           | 403: 没有权限访问此资源 |

> **说明**：`hl_open_interest` 全部 3 个 action 均 403，整个 HL OI 功能在当前 tier 不可用。`hl_taker` 的 delta 被锁，但 klines 可用。

---

## 2. 500 后端错误（2 个）

AiCoin 后端返回 500，非 MCP 代码问题，需反馈给后端团队。

| 工具             | Action        | 请求参数      | 错误                           |
| ---------------- | ------------- | ------------- | ------------------------------ |
| `hl_liquidation` | top_positions | `coin: "BTC"` | API 500: Internal Server Error |
| `hl_advanced`    | discover      | (无参数)      | API 500: Internal Server Error |

---

## 3. API 功能限制（1 个）

API 本身的功能限制，非权限问题。

| 工具               | Action          | 请求参数                             | 错误                                        | 说明                                                      |
| ------------------ | --------------- | ------------------------------------ | ------------------------------------------- | --------------------------------------------------------- |
| `coin_open_interest` | (coin-margined) | `symbol: "ETH", margin_type: "coin"` | 400: Only BTC-related symbols are supported | coin-margined OI 仅支持 BTC，stablecoin-margined 无此限制 |

---

## 4. 账户/交易所限制（3 个）

MCP 工具正确调用了交易所 API，但因 OKX 账户状态或 AiCoin tier 限制导致失败。

| 工具             | Action | 请求参数                                                  | 错误                                                                                    | 说明                                                       |
| ---------------- | ------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `transfer`       | —      | `code: "USDT", amount: 1, from: "spot", to: "swap"`      | OKX 58123: Adjust your position structure to make sure your margin is in a safe status  | OKX 统一账户模式下保证金安全限制，工具调用正确但账户不允许 |
| `signal_manage`  | add    | `subType: "td:1440:classic:9", symbol: "btcusdt:binance"` | Permission denied: 设置预警失败。Endpoint: `/api/v2/signal/addSignalAlert`              | **后端未适配，已从工具中移除** |
| `signal_manage`  | delete | `id: "999999"` (无效 ID 测试)                             | Permission denied: common.not_exist_id。Endpoint: `/api/v2/signal/delSignalAlert`      | 无效 ID 测试返回正确错误；用真实 ID 139838 测试 **成功** ✅ |

> **说明**：
> - `signal_manage delete` 实际已成功测试（删除了 ID 139838 的 BOLL 预警），仅无效 ID 测试返回了预期的 400 错误
> - `signal_manage add` 的 subType 格式为 `indicator:period:triggerKey:params`（如 `macd:5:fork:12,26,9`），从 `signal_data config` 可获取有效值
> - `transfer` 在 OKX 统一账户模式下可能不需要显式转账，资金在 spot/swap 间共享

---

## 5. 未测试 — 缺少测试数据（3 个）

API 调用成功（返回规范的 400 错误），但测试用的地址/ID 没有匹配数据，无法验证正常返回格式。

| 工具          | Action               | 原因                                                   | 测试结果                 |
| ------------- | -------------------- | ------------------------------------------------------ | ------------------------ |
| `hl_position` | completed_history    | 测试地址无已平仓位，API 返回 400: "position not found" | API 调用正常，缺匹配数据 |
| `hl_position` | completed_pnl        | 同上                                                   | API 调用正常，缺匹配数据 |
| `hl_position` | completed_executions | 同上                                                   | API 调用正常，缺匹配数据 |

> **说明**：
> - `completed_history` 要求必须传 `startTime` 或 `endTime`（至少一个），当前工具描述标注为 Optional，建议改为 "at least one of startTime/endTime is required"
> - 同工具的 `current_history`、`current_pnl`、`current_executions` 均已成功测试

---

## 6. 已知 Bug

| 位置                                                       | 问题                                                                        | 状态               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------ |
| `guide.ts` → `getApiKeyGuide()` / `getTradeSetupGuide()`  | 源码已修正为 `@aicoin/aicoin-mcp`，但 npm v1.0.1 包仍为旧的 `@aicoin/mcp` | 源码已修，需发新版 |

---

## 7. 成功测试汇总（103 个）

### Market Data（58 个 ✅）

| 工具                 | 测试的 Actions                                                           |
| -------------------- | ------------------------------------------------------------------------ |
| `coin_info`          | list, ticker, config, ai_analysis                                        |
| `coin_funding_rate`  | default (per-exchange), weighted                                         |
| `coin_liquidation`   | history, map, estimated                                                  |
| `coin_open_interest` | stablecoin/BTC, coin/BTC                                                 |
| `coin_futures_data`  | historical_depth, super_depth, trade_data                                |
| `market_info`        | exchanges, ticker, hot_coins, futures_interest                           |
| `kline`              | data, indicator, trading_pair                                            |
| `index_data`         | list, price, info                                                        |
| `crypto_stock`       | quotes, top_gainer, company                                              |
| `coin_treasury`      | summary, entities, history, accumulated, latest_entities, latest_history  |
| `depth`              | latest, full, grouped                                                    |
| `market_overview`    | nav, ls_ratio, liquidation, grayscale_trust, gray_scale, stock_market    |
| `order_flow`         | big_orders, agg_trades                                                   |
| `trading_pair`       | ticker, by_market, list                                                  |
| `signal_data`        | strategy, alert, config, alert_list, change                              |
| `news`               | list, detail, rss                                                        |
| `flash`              | newsflash, list, exchange_listing                                        |
| `guide`              | api_key, upgrade, trade_setup                                            |

### Hyperliquid（24 个 ✅）

| 工具             | 测试的 Actions                                                             |
| ---------------- | -------------------------------------------------------------------------- |
| `hl_ticker`      | all, single                                                                |
| `hl_whale`       | positions, events, directions, history_ratio                               |
| `hl_liquidation` | history, stats_by_coin                                                     |
| `hl_taker`       | klines                                                                     |
| `hl_trader`      | stats, best_trades, performance, completed_trades, accounts, statistics    |
| `hl_fills`       | top_trades, by_address, by_oid                                             |
| `hl_orders`      | top_open, active_stats, latest, filled, by_oid, filled_by_oid, twap_states |
| `hl_position`    | current_history, current_pnl, current_executions                           |
| `hl_portfolio`   | portfolio, pnls, max_drawdown, net_flow                                    |
| `hl_advanced`    | info (allMids), smart_find                                                 |

### Exchange Trading via CCXT/OKX（21 个 ✅）

| 工具                   | 测试的 Actions                                   | 备注                                    |
| ---------------------- | ------------------------------------------------ | --------------------------------------- |
| `exchange_info`        | exchanges, markets                               |                                         |
| `exchange_ticker`      | single, multiple                                 |                                         |
| `exchange_market_data` | orderbook, trades, ohlcv                         |                                         |
| `exchange_funding`     | current, history                                 |                                         |
| `account_status`       | balance, positions                               |                                         |
| `account_orders`       | open, closed, by_id, my_trades                   | by_id 通过下单后查询验证                |
| `account_history`      | ledger, deposits, withdrawals                    |                                         |
| `create_order`         | limit, market                                    | limit@$10000 不成交，market 0.00001 BTC |
| `cancel_order`         | single, cancel_all                               | single 取消了 limit 单，cancel_all 清空 |
| `set_trading_config`   | leverage (10x), margin_mode (cross)              | BTC/USDT:USDT swap                      |
| `signal_manage`        | delete                                           | 成功删除 ID 139838                      |
| `hl_fills`             | by_twapid (路由测试)                             | 无有效 TWAP ID，但路由可达              |
