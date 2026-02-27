# OpenData MCP v1.0.17 — 后端接口问题清单

测试时间：2026-02-27
测试账号：Premium 级别
MCP 版本：@aicoin/opendata-mcp v1.0.17

---

## 一、500 错误（10个）

以下接口返回 HTTP 500，MCP 侧参数无误，需要后端排查。

### 国库类（全部 6 个）

| # | 工具名 | 路由 | 方法 | 测试参数 |
|---|--------|------|------|----------|
| 1 | get_coin_treasury_summary | `/api/upgrade/v2/coin-treasuries/summary` | GET | `coin=BTC` |
| 2 | get_coin_treasury_entities | `/api/upgrade/v2/coin-treasuries/entities` | POST | `{"coin":"BTC"}` |
| 3 | get_coin_treasury_history | `/api/upgrade/v2/coin-treasuries/history` | POST | `{"coin":"BTC"}` |
| 4 | get_coin_treasury_accumulated | `/api/upgrade/v2/coin-treasuries/history/accumulated` | POST | `{"coin":"BTC"}` |
| 5 | get_latest_coin_treasury_entities | `/api/upgrade/v2/coin-treasuries/latest/entities` | GET | `coin=BTC` |
| 6 | get_latest_coin_treasury_history | `/api/upgrade/v2/coin-treasuries/latest/history` | GET | `coin=BTC` |

### 其他 500 错误（4个）

| # | 工具名 | 路由 | 方法 | 测试参数 |
|---|--------|------|------|----------|
| 7 | get_change_signal | `/api/v2/signal/changeSignal` | GET | 无参数 / `type=1` |
| 8 | get_stock_market | `/api/v2/mix/stock-market` | GET | 无参数 |
| 9 | hl_get_top_trades | `/api/upgrade/v2/hl/fills/top-trades` | GET | 无参数 / `coin=BTC` |
| 10 | hl_get_liquidation_top_positions | `/api/upgrade/v2/hl/liquidations/top-positions` | GET | 无参数 / `coin=BTC` |

---

## 二、返回空数据（3个）

以下接口参数与文档一致，但返回空数据，需后端确认是数据问题还是接口问题。

| # | 工具名 | 路由 | 方法 | 测试参数 | 备注 |
|---|--------|------|------|----------|------|
| 1 | get_funding_rate_history | `/api/upgrade/v2/futures/funding-rate/history` | GET | `symbol=btcswapusdt:okcoinfutures&interval=1h` | data 为空 |
| 2 | get_weighted_funding_rate_history | `/api/upgrade/v2/futures/funding-rate/vol-weight-history` | GET | `symbol=btcswapusdt&interval=1h` | data 为空 |
| 3 | get_super_depth_history | `/api/upgrade/v2/futures/super-depth/history` | GET | `key=btcswapusdt:okcoinfutures` | data 为空 |

---

## 三、AI 分析部分字段为空（1个）

| # | 工具名 | 路由 | 方法 | 测试参数 | 备注 |
|---|--------|------|------|----------|------|
| 1 | get_ai_coin_analysis | `/api/v2/content/ai-coins` | POST | `{"coinKeys":["bitcoin"]}` | interpret 和 trend 字段为空 |

---

## 复现方式

使用 curl 测试（替换签名参数）：

```bash
# 国库类 500 示例
curl -G "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/summary" \
  -d "coin=BTC" \
  -d "AccessKeyId=YOUR_KEY" \
  -d "SignatureNonce=NONCE" \
  -d "Timestamp=TS" \
  -d "Signature=SIG"

# 空数据示例 - funding rate
curl -G "https://open.aicoin.com/api/upgrade/v2/futures/funding-rate/history" \
  -d "symbol=btcswapusdt:okcoinfutures" \
  -d "interval=1h" \
  -d "limit=100" \
  -d "AccessKeyId=YOUR_KEY" \
  -d "SignatureNonce=NONCE" \
  -d "Timestamp=TS" \
  -d "Signature=SIG"
```
