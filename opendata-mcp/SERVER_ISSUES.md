# OpenData MCP 服务端问题验证文档

> 以下接口在 MCP 代码层面参数已正确，但服务端返回异常。
> 测试时间：2026-02-26，四个等级 key 均已测试。

## 签名脚本

所有 GET 请求依赖签名脚本，保存为 `aicoin-curl.sh`：

```bash
#!/bin/bash
API_KEY="$1"; SECRET="$2"; URL="$3"
NONCE=$(openssl rand -hex 4); TS=$(date +%s)
STR="AccessKeyId=${API_KEY}&SignatureNonce=${NONCE}&Timestamp=${TS}"
HEX=$(echo -n "$STR" | openssl dgst -sha1 -hmac "$SECRET" | awk '{print $2}')
SIG=$(echo -n "$HEX" | base64)
if [[ "$URL" == *"?"* ]]; then
  FULL="${URL}&AccessKeyId=${API_KEY}&SignatureNonce=${NONCE}&Timestamp=${TS}&Signature=${SIG}"
else
  FULL="${URL}?AccessKeyId=${API_KEY}&SignatureNonce=${NONCE}&Timestamp=${TS}&Signature=${SIG}"
fi
curl -s "$FULL"
```

## 测试 Key

```bash
export API_KEY="21SN880VCJNGPzkY0CIypdksrK238FvQ"
export SECRET="QBUHSE57ikxfydTs0VCJNHk2NoAr9uls"
```

---

## 一、500 错误（8个接口）

### 1. get_stock_market

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/v2/mix/stock-market"
# 返回: {"success":false,"error":"服务器内部错误"}
```

### 2. get_change_signal

```bash
# 无参数
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/v2/signal/changeSignal"

# 带参数
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/v2/signal/changeSignal?type=1&currency=usd"
# 均返回: {"success":false,"error":"服务器内部错误"}
```

### 3. get_coin_treasury_entities (POST)

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/entities?coin=BTC"
# 试过 BTC / ETH / bitcoin / btc，均返回:
# {"success":false,"error":"获取数据失败"}
```

### 4. get_coin_treasury_history (POST)

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/history?coin=BTC"
# 返回: {"success":false,"error":"获取数据失败"}
```

### 5. get_coin_treasury_accumulated (POST)

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/history/accumulated?coin=BTC"
# 返回: {"success":false,"error":"获取数据失败"}
```

### 6. get_latest_coin_treasury_entities (GET)

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/latest/entities?coin=BTC"
# 返回: {"success":false,"error":"获取数据失败"}
```

### 7. get_latest_coin_treasury_history (GET)

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/latest/history?coin=BTC"
# 返回: {"success":false,"error":"获取数据失败"}
```

### 8. get_coin_treasury_summary (GET)

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/coin-treasuries/summary?coin=BTC"
# 返回: {"success":false,"error":"获取数据失败"}
```

---

## 二、403 错误（3个接口，所有等级 key 均无权限）

### 1. get_latest_depth

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/futures/latest-depth?coin=BTC"
# 返回: {"success":false,"error":"没有权限访问此资源"}
```

### 2. get_full_depth

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/futures/full-depth?coin=BTC"
# 返回: {"success":false,"error":"没有权限访问此资源"}
```

### 3. get_full_depth_grouped

```bash
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/upgrade/v2/futures/full-depth/grouped?coin=BTC"
# 返回: {"success":false,"error":"没有权限访问此资源"}
```

> 备注：basic / normal / premium / professional 四个等级 key 均返回403，不是权限等级问题。

---

## 三、404 错误（Hyperliquid 全模块，30+ 接口）

两种前缀均不可用：

| 前缀 | 返回 | 说明 |
|------|------|------|
| `/api/v2/hl/*` | JSON 404: `{"success":false,"errorCode":404,"error":"Not Found"}` | 请求到达 API 服务器，但路由未注册 |
| `/v2/hl/*` | HTML 404: `<h1>404 Not Found</h1>` (stgw) | 请求被 nginx 网关拦截，未配置转发规则 |

### 验证命令

```bash
# /api/v2/hl/ 前缀 → JSON 404（API 层）
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/v2/hl/tickers/coin/ETH"

# /v2/hl/ 前缀（文档示例格式）→ HTML 404（nginx 层）
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/v2/hl/tickers/coin/ETH"

# whale positions
bash aicoin-curl.sh "$API_KEY" "$SECRET" \
  "https://open.aicoin.com/api/v2/hl/whales/open-positions"
```

### 完整路由列表（均404）

| 接口 | 路由 |
|------|------|
| hl_get_tickers | GET /api/v2/hl/tickers |
| hl_get_ticker_by_coin | GET /api/v2/hl/tickers/coin/{coin} |
| hl_get_whale_positions | GET /api/v2/hl/whales/open-positions |
| hl_get_whale_position_by_address | GET /api/v2/hl/whales/open-positions/{address} |
| hl_get_liquidations | GET /api/v2/hl/liquidations/history |
| hl_get_trader_stats | GET /api/v2/hl/traders/{address}/addr-stat |
| hl_get_trader_open_positions | GET /api/v2/hl/traders/{address}/open-positions |
| hl_get_trader_pnl_history | GET /api/v2/hl/traders/{address}/pnl-history |
| hl_get_fills_by_address | GET /api/v2/hl/fills/{address} |
| hl_info | POST /api/v2/hl/info |
| hl_get_fills_by_oid | GET /api/v2/hl/fills/oid/{oid} |
| hl_get_fills_by_twapid | GET /api/v2/hl/fills/twapid/{twapId} |
| hl_get_top_trades | GET /api/v2/hl/trades/top |
| hl_get_filled_orders | GET /api/v2/hl/filled-orders/{address} |
| hl_get_filled_order_by_oid | GET /api/v2/hl/filled-orders/oid/{oid} |
| hl_get_orders | GET /api/v2/hl/orders/{address} |
| hl_get_order_by_oid | GET /api/v2/hl/orders/oid/{oid} |
| hl_get_top_open_orders | GET /api/v2/hl/orders/top |
| hl_get_active_stats | GET /api/v2/hl/active-stats |
| hl_get_portfolio | GET /api/v2/hl/portfolio/{address} |
| hl_get_pnls | GET /api/v2/hl/pnls/{address} |
| hl_get_best_trades | GET /api/v2/hl/best-trades/{address} |
| hl_get_performance_by_coin | GET /api/v2/hl/performance/{address} |
| hl_get_completed_trades | GET /api/v2/hl/completed-trades/{address} |
| hl_get_current_position_history | GET /api/v2/hl/positions/current/{address} |
| hl_get_completed_position_history | GET /api/v2/hl/positions/completed/{address} |
| hl_get_current_position_pnl | GET /api/v2/hl/positions/current-pnl/{address} |
| hl_get_completed_position_pnl | GET /api/v2/hl/positions/completed-pnl/{address} |
| hl_get_current_position_executions | GET /api/v2/hl/positions/current-executions/{address} |
| hl_get_completed_position_executions | GET /api/v2/hl/positions/completed-executions/{address} |
| hl_get_traders_accounts | POST /api/v2/hl/traders/accounts |
| hl_get_traders_statistics | POST /api/v2/hl/traders/statistics |
| hl_get_whale_events | GET /api/v2/hl/whales/events |
| hl_get_whale_directions | GET /api/v2/hl/whales/directions |
| hl_get_whale_history_long_ratio | GET /api/v2/hl/whales/long-ratio |
| hl_get_liquidation_stats | GET /api/v2/hl/liquidations/stat |
| hl_get_liquidation_stats_by_coin | GET /api/v2/hl/liquidations/stat/{coin} |
| hl_get_liquidation_top_positions | GET /api/v2/hl/liquidations/top |
| hl_smart_find | POST /api/v2/hl/smart/find |
| hl_discover_traders | POST /api/v2/hl/discover |
| hl_get_twap_states | GET /api/v2/hl/twap/{address} |
| hl_get_max_drawdown | GET /api/v2/hl/drawdown/{address} |
| hl_get_net_flow | GET /api/v2/hl/net-flow/{address} |
| hl_get_klines_with_taker_vol | GET /api/v2/hl/klines |

> 备注：basic / normal / premium / professional 四个等级 key 均返回404，确认是整个模块路由未注册到网关。

---

## 汇总

| 类型 | 数量 | 说明 |
|------|------|------|
| 500 服务器错误 | 8 | stock-market、changeSignal、Treasury 全部 |
| 403 无权限 | 3 | depth 相关，所有等级 key 均403 |
| 404 路由未注册 | 41 | Hyperliquid 全模块 |
| **合计** | **52** | |
