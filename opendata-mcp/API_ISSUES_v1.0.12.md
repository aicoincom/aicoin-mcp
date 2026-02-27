# OpenData MCP v1.0.12 — 后端接口问题清单

测试时间：2026-02-27
测试账号：Premium 级别
MCP 版本：@aicoin/opendata-mcp v1.0.12

---

## 500 错误（5个）

以下接口返回 HTTP 500，MCP 侧参数无误，需要后端排查。

### 1. get_coin_treasury_summary

| 项目     | 内容                                          |
| -------- | --------------------------------------------- |
| 路由     | `GET /api/upgrade/v2/coin-treasuries/summary` |
| 权限     | 需确认                                        |
| 测试参数 | `coin=BTC`                                    |
| 返回     | 500 Internal Server Error                     |
| 说明     | 获取币种国库数据汇总                          |

### 2. get_latest_coin_treasury_entities

| 项目     | 内容                                                  |
| -------- | ----------------------------------------------------- |
| 路由     | `GET /api/upgrade/v2/coin-treasuries/latest/entities` |
| 权限     | 需确认                                                |
| 测试参数 | `coin=BTC`                                            |
| 返回     | 500 Internal Server Error                             |
| 说明     | 获取最新币种国库实体数据                              |

### 3. get_change_signal

| 项目     | 内容                              |
| -------- | --------------------------------- |
| 路由     | `GET /api/v2/signal/changeSignal` |
| 权限     | 无需特殊权限（v2 公开接口）       |
| 测试参数 | 无参数 / `type=1`                 |
| 返回     | 500 Internal Server Error         |
| 说明     | 获取异动信号数据                  |

### 4. get_stock_market

| 项目     | 内容                           |
| -------- | ------------------------------ |
| 路由     | `GET /api/v2/mix/stock-market` |
| 权限     | 无需特殊权限（v2 公开接口）    |
| 测试参数 | 无参数                         |
| 返回     | 500 Internal Server Error      |
| 说明     | 获取加密相关股票市场数据       |

### 5. hl_get_top_trades

| 项目     | 内容                                      |
| -------- | ----------------------------------------- |
| 路由     | `GET /api/upgrade/v2/hl/fills/top-trades` |
| 权限     | 需确认（upgrade 接口）                    |
| 测试参数 | 无参数 / `coin=BTC`                       |
| 返回     | 500 Internal Server Error                 |
| 说明     | 获取 Hyperliquid 大额成交记录             |

---

## 已修复的问题（v1.0.12）

以下3个接口之前因 MCP 侧参数名错误导致 400，已在 v1.0.12 修复：

| 接口                     | 修复内容                                |
| ------------------------ | --------------------------------------- |
| `get_latest_depth`       | `coin` → `dbKey`，新增 `size` 参数      |
| `get_full_depth`         | `coin` → `dbKey`                        |
| `get_full_depth_grouped` | `coin` → `dbKey`，新增 `groupSize` 参数 |

---

## 复现方式

使用 curl 测试（替换签名参数）：

```bash
# 1. get_coin_treasury_summary
curl -G "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/summary" \
  -d "coin=BTC" \
  -d "AccessKeyId=YOUR_KEY" \
  -d "SignatureNonce=NONCE" \
  -d "Timestamp=TS" \
  -d "Signature=SIG"

# 2. get_latest_coin_treasury_entities
curl -G "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/latest/entities" \
  -d "coin=BTC" \
  -d "AccessKeyId=YOUR_KEY" \
  -d "SignatureNonce=NONCE" \
  -d "Timestamp=TS" \
  -d "Signature=SIG"

# 3. get_change_signal
curl -G "https://open.aicoin.com/api/v2/signal/changeSignal" \
  -d "AccessKeyId=YOUR_KEY" \
  -d "SignatureNonce=NONCE" \
  -d "Timestamp=TS" \
  -d "Signature=SIG"

# 4. get_stock_market
curl -G "https://open.aicoin.com/api/v2/mix/stock-market" \
  -d "AccessKeyId=YOUR_KEY" \
  -d "SignatureNonce=NONCE" \
  -d "Timestamp=TS" \
  -d "Signature=SIG"

# 5. hl_get_top_trades
curl -G "https://open.aicoin.com/api/upgrade/v2/hl/fills/top-trades" \
  -d "AccessKeyId=YOUR_KEY" \
  -d "SignatureNonce=NONCE" \
  -d "Timestamp=TS" \
  -d "Signature=SIG"
```
