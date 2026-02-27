# OpenData MCP 接口问题清单 (v1.0.8)

> 测试时间: 2026-02-26
> 测试 Key: Professional 等级 (api_key: 21SN88...)
> 基础路径: https://open.aicoin.com
> MCP 版本: @aicoin/opendata-mcp@1.0.8

## 一、Hyperliquid 403 权限不足 (17个)

以下接口均返回 HTTP 403，使用 Professional 等级 Key 测试。
需确认：是 Key 等级限制还是接口未对外开放？

| # | MCP 工具名 | API 路由 |
|---|-----------|---------|
| 1 | hl_get_top_trades | GET `/api/upgrade/v2/hl/fills/top-trades` |
| 2 | hl_get_top_open_orders | GET `/api/upgrade/v2/hl/orders/top-open-orders` |
| 3 | hl_get_active_stats | GET `/api/upgrade/v2/hl/orders/active-stats` |
| 4 | hl_get_liquidation_top_positions | GET `/api/upgrade/v2/hl/liquidations/top-positions` |
| 5 | hl_get_whale_history_long_ratio | GET `/api/upgrade/v2/hl/whales/history-long-ratio` |
| 6 | hl_get_klines_with_taker_vol | GET `/api/upgrade/v2/hl/klines-with-taker-vol/{coin}/{interval}` |
| 7 | hl_discover_traders | POST `/api/upgrade/v2/hl/traders/discover` |
| 8 | hl_get_max_drawdown | GET `/api/upgrade/v2/hl/max-drawdown/{address}` |
| 9 | hl_get_net_flow | GET `/api/upgrade/v2/hl/ledger-updates/net-flow/{address}` |
| 10 | hl_get_twap_states | GET `/api/upgrade/v2/hl/twap-states/{address}/latest` |
| 11 | hl_get_filled_orders | GET `/api/upgrade/v2/hl/filled-orders/{address}/latest` |
| 12 | hl_get_current_position_history | GET `/api/upgrade/v2/hl/traders/{address}/current-position-history/{coin}` |
| 13 | hl_get_completed_position_history | GET `/api/upgrade/v2/hl/traders/{address}/completed-position-history/{coin}` |
| 14 | hl_get_current_position_pnl | GET `/api/upgrade/v2/hl/traders/{address}/current-position-pnl/{coin}` |
| 15 | hl_get_completed_position_pnl | GET `/api/upgrade/v2/hl/traders/{address}/completed-position-pnl/{coin}` |
| 16 | hl_get_current_position_executions | GET `/api/upgrade/v2/hl/traders/{address}/current-position-executions/{coin}` |
| 17 | hl_get_completed_position_executions | GET `/api/upgrade/v2/hl/traders/{address}/completed-position-executions/{coin}` |

## 二、非 HL 接口 403 问题 (3个)

以下 Futures Depth 接口，使用全部 4 个等级 Key 测试均返回 403。

| # | MCP 工具名 | API 路由 |
|---|-----------|---------|
| 1 | get_latest_depth | GET `/api/upgrade/v2/futures/latest-depth?coin=BTC` |
| 2 | get_full_depth | GET `/api/upgrade/v2/futures/full-depth?coin=BTC` |
| 3 | get_full_depth_grouped | GET `/api/upgrade/v2/futures/full-depth/grouped?coin=BTC` |

已测试 Key：Basic / Normal / Premium / Professional，结果一致。

## 三、汇总

| 类别 | 数量 | 问题 | 需要后端处理 |
|------|------|------|-------------|
| HL 403 权限不足 | 17 | Professional Key 仍返回 403 | 确认是否开放 / 权限配置 |
| Depth 403 | 3 | 全等级 Key 均 403 | 确认权限配置 |
| **合计** | **20** | | |

> MCP 侧所有参数 bug 已在 v1.0.8 全部修复，剩余 20 个均为服务端权限问题。

## 四、复现 curl

```bash
# 1. 生成签名参数（将输出赋值给 P）
P=$(node -e "
const crypto = require('crypto');
const key = '21SN880VCJNGPzkY0CIypdksrK238FvQ';
const secret = 'QBUHSE57ikxfydTs0VCJNHk2NoAr9uls';
const nonce = crypto.randomBytes(4).toString('hex');
const ts = Math.floor(Date.now()/1000).toString();
const str = 'AccessKeyId='+key+'&SignatureNonce='+nonce+'&Timestamp='+ts;
const hex = crypto.createHmac('sha1', secret).update(str).digest('hex');
const sig = Buffer.from(hex, 'binary').toString('base64');
console.log('AccessKeyId='+key+'&SignatureNonce='+nonce+'&Timestamp='+ts+'&Signature='+encodeURIComponent(sig));
")

# 2. HL 403 示例（任选一个）
curl -s "https://open.aicoin.com/api/upgrade/v2/hl/fills/top-trades?${P}"
# → 403

# 3. Depth 403 示例
curl -s "https://open.aicoin.com/api/upgrade/v2/futures/latest-depth?${P}&coin=BTC"
# → 403
```
