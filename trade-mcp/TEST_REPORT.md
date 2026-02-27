# AiCoin Trade MCP v1.0.7 测试报告

**测试日期**: 2026-02-27
**测试版本**: @aicoin/trade-mcp@1.0.7
**测试环境**: macOS Darwin 24.3.0, Node.js, 代理 http://127.0.0.1:7890
**API 密钥**: OKX (读取/交易权限)
**测试方式**: 自动化测试脚本 (test-mcp.mjs) 通过 MCP stdio 协议直接通信
**测试结果**: 39/39 全部通过 ✅

---

## 一、版本变更 (v1.0.5 → v1.0.7)

### v1.0.5 已修复的 Bug (来自初次测试)
1. **移除 pionex** — 从 SUPPORTED_EXCHANGES 中移除（ccxt 不支持）
2. **OKX 公开接口认证问题** — 添加 `skipAuth` 机制，公开接口不注入凭证
3. **get_tickers 空数组崩溃** — 空数组视为 undefined，返回全部 tickers
4. **orderbook limit=0 未校验** — Zod schema 添加 `.min(1)`

### v1.0.6 新增修复
5. **超时太短** — 默认超时从 10s → 30s（可通过 `EXCHANGE_TIMEOUT` 环境变量自定义）
6. **代理配置 bug** — `http://` 代理 URL 现在正确设置 `httpsProxy`

### v1.0.7 修复
7. **代理冲突** — ccxt 不允许同时设置 httpProxy + httpsProxy，改为只设 `httpsProxy`

---

## 二、测试概览

| 类别 | 测试数 | 通过 | 失败 |
|------|--------|------|------|
| 公开市场数据 | 21 | 21 | 0 |
| OKX 账户数据（私有） | 10 | 10 | 0 |
| 边界情况 & Bug 验证 | 8 | 8 | 0 |
| **合计** | **39** | **39** | **0** |

---

## 三、公开市场数据接口 (21/21 ✅)

### 3.1 list_exchanges
- ✅ 返回 9 个交易所，pionex 已移除

### 3.2 get_ticker (全交易所覆盖)
| 交易所 | 交易对 | 结果 | 价格 |
|--------|--------|------|------|
| binance | BTC/USDT | ✅ | 67871 |
| okx | BTC/USDT | ✅ | 67868 |
| bybit | BTC/USDT | ✅ | 67870 |
| bitget | BTC/USDT | ✅ | 67865 |
| gate | BTC/USDT | ✅ | 67874 |
| huobi | BTC/USDT | ✅ | 67871 |
| hyperliquid | BTC/USDC:USDC | ✅ | USDC 对正常 |
| binanceusdm | BTC/USDT:USDT | ✅ | 67843 (U本位) |
| binancecoinm | BTC/USD:BTC | ✅ | 67840 (币本位) |

### 3.3 其他公开接口
| 测试项 | 结果 | 说明 |
|--------|------|------|
| get_tickers (2 symbols) | ✅ | {total:2, data:[...]} |
| get_orderbook (limit=5) | ✅ | bids=5, asks=5 |
| get_trades (limit=5) | ✅ | 5条成交 |
| get_ohlcv (binance/bybit/gate/hl) | ✅ | 各3根K线 |
| get_funding_rates (binance) | ✅ | rate=-0.00008194 |
| get_funding_rates (bybit) | ✅ | rate=-0.00001738 |
| get_funding_rate_history | ✅ | 3条历史 |
| get_markets (bybit) | ✅ | {total:100, data:[...]} |

---

## 四、OKX 账户数据接口 (10/10 ✅)

| 工具 | 结果 | 说明 |
|------|------|------|
| get_balance | ✅ | 返回 USDT 余额 |
| get_open_orders | ✅ | 0 条（无挂单） |
| get_closed_orders | ✅ | 0 条 |
| get_positions | ✅ | 0 条（无持仓） |
| get_my_trades | ✅ | 0 条 |
| get_ledger | ✅ | 0 条 |
| get_deposits | ✅ | 0 条 |
| get_withdrawals | ✅ | 0 条 |
| set_leverage | ✅ | BTC-USDT-SWAP 3x cross 设置成功 |
| set_margin_mode | ✅ | 参数校验正常 |

---

## 五、边界情况 & Bug 验证 (8/8 ✅)

| 测试项 | 结果 | 说明 |
|--------|------|------|
| 无效交易所名 | ✅ | 正确拒绝，列出可用交易所 |
| 无效交易对 | ✅ | 正确报错 "does not have market symbol" |
| get_tickers([]) 空数组 | ✅ | 返回全部 tickers (total=3508) |
| orderbook limit=0 | ✅ | Zod 校验拒绝 "must be >= 1" |
| OKX 公开数据 skipAuth | ✅ | 不再报 passphrase 错误 |
| 无效 timeframe | ✅ | 交易所正确报错 "Invalid interval" |
| 无 API Key 私有接口 | ✅ | 正确报错 "requires apiKey credential" |
| pionex 已移除 | ✅ | 正确报错 "not supported" |

---

## 六、总结

### 整体评价：✅ 全部通过，生产可用

v1.0.7 修复了初次测试发现的全部 7 个问题后，39 项测试全部通过。

### 已修复问题清单
| # | 问题 | 修复版本 |
|---|------|---------|
| 1 | pionex 在列表中但 ccxt 不支持 | v1.0.5 |
| 2 | OKX 公开接口误带认证头 | v1.0.5 |
| 3 | get_tickers([]) 崩溃 | v1.0.5 |
| 4 | orderbook limit=0 未校验 | v1.0.5 |
| 5 | ccxt 默认超时 10s 太短 | v1.0.6 |
| 6 | http:// 代理未设 httpsProxy | v1.0.6 |
| 7 | ccxt 不允许同时设 httpProxy+httpsProxy | v1.0.7 |

### 未测试项
- `create_order` — 避免真实下单，建议用 OKX 模拟盘测试
- `cancel_order` / `cancel_all_orders` — 无挂单可取消
- `get_order` — 无订单 ID 可查
- `transfer` — 需要资金划转权限
