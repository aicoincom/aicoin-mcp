# AiCoin Trade MCP 测试报告

- 测试时间：2026-02-27 05:32 ~ 06:03 UTC
- 测试环境：macOS Darwin 24.3.0
- 测试方式：直接调用 MCP 工具接口

---

## 一、测试概览

| 类别 | 工具数量 | 通过 | 失败 | 需关注 |
|------|---------|------|------|--------|
| 市场数据（公开） | 9 | 9 | 0 | 2 |
| 账户数据（需认证） | 8 | 0 | 0 | 8（无API Key） |
| 交易操作（需认证） | 6 | 0 | 0 | 6（无API Key） |
| 边界/错误处理 | - | 6 | 2 | - |

---

## 二、市场数据类工具测试（公开接口）

### 2.1 list_exchanges ✅
- 返回 10 个交易所：binance, binanceusdm, binancecoinm, okx, bybit, bitget, gate, huobi, pionex, hyperliquid
- 数据格式正确，JSON 数组

### 2.2 get_markets ✅
| 交易所 | market_type | 结果 |
|--------|------------|------|
| binance | spot (quote=USDT) | ✅ 返回 BTC/USDT, ETH/USDT 等 |
| hyperliquid | spot | ✅ 返回 PURR/USDC 等（注意：用 USDC） |
| hyperliquid | swap | ✅ 返回 BTC/USDC:USDC 等 |
| binance | base=NONEXISTENT | ✅ 返回空数组 `[]`，处理正确 |
| okx | swap | ❌ 需要 OK-ACCESS-PASSPHRASE 认证 |

### 2.3 get_ticker ✅
| 交易所 | 交易对 | market_type | 结果 |
|--------|--------|------------|------|
| binance | BTC/USDT | spot | ✅ |
| bybit | BTC/USDT | spot | ✅ |
| bybit | ETH/USDT | swap | ✅ |
| bitget | BTC/USDT | spot | ✅ |
| gate | BTC/USDT | spot | ✅ |
| huobi | BTC/USDT | spot | ✅ |
| binanceusdm | BTC/USDT:USDT | - | ✅ |
| binancecoinm | BTC/USD:BTC | - | ✅ |
| hyperliquid | PURR/USDC | spot | ✅ |
| hyperliquid | BTC/USDC:USDC | swap | ✅ |
| binance | ETH/USDT | swap | ✅ |

### 2.4 get_tickers ✅
- binance 多交易对 `["BTC/USDT", "ETH/USDT"]` → ✅ 返回 2 条数据
- binance 空数组 `[]` → ⚠️ 报错 "does not have market symbol undefined"（错误信息不友好）

### 2.5 get_orderbook ✅
| 测试场景 | 结果 |
|---------|------|
| binance BTC/USDT limit=5 | ✅ 返回 5 档买卖盘 |
| binance BTC/USDT limit=1000 | ✅ 返回大量深度数据 |
| bybit ETH/USDT limit=3 | ✅ |
| binance BTC/USDT limit=0 | ⚠️ Binance 报错 "Mandatory parameter 'limit' was not sent" |

### 2.6 get_trades ✅
| 测试场景 | 结果 |
|---------|------|
| binance BTC/USDT limit=3 | ✅ 返回 3 条成交记录 |
| gate ETH/USDT limit=3 | ✅ |

### 2.7 get_ohlcv ✅
| 测试场景 | 结果 |
|---------|------|
| binance BTC/USDT 1d limit=3 | ✅ OHLCV 数组格式正确 |
| binance ETH/USDT swap 1h limit=3 | ✅ |
| bybit BTC/USDT swap 4h limit=3 | ✅ |
| gate BTC/USDT 1w limit=3 | ✅ |
| hyperliquid BTC/USDC:USDC swap 1h limit=3 | ✅ |
| binance BTC/USDT timeframe=invalid | ✅ 正确报错 "Invalid interval" |

### 2.8 get_funding_rates ✅
| 测试场景 | 结果 |
|---------|------|
| binance BTC/USDT:USDT + ETH/USDT:USDT | ✅ 返回资金费率、标记价格等 |
| bybit BTC/USDT:USDT | ✅ 含 interval="8h" |
| hyperliquid BTC/USDC:USDC | ✅ 含 interval="1h" |
| binance INVALID/PAIR:USDT | ✅ 正确报错 |

### 2.9 get_funding_rate_history ✅
| 测试场景 | 结果 |
|---------|------|
| binance BTC/USDT:USDT limit=3 | ✅ 返回 3 条历史记录 |
| bybit BTC/USDT:USDT limit=3 | ✅ |

---

## 三、账户数据类工具测试（需认证）

> 所有账户类接口均需要 API Key 认证。当前环境未配置任何交易所的 API Key。

| 工具 | 交易所 | 结果 | 错误信息 |
|------|--------|------|---------|
| get_balance | binance (spot) | ❌ 需认证 | `requires "apiKey" credential` |
| get_balance | bybit | ❌ 需认证 | `requires "apiKey" credential` |
| get_balance | okx | ❌ 需认证 | `Request header OK-ACCESS-PASSPHRASE incorrect` |
| get_open_orders | binance (无symbol) | ⚠️ 警告 | 触发频率限制警告（需设置 warnOnFetchOpenOrdersWithoutSymbol） |
| get_open_orders | binance (BTC/USDT) | ❌ 需认证 | `requires "apiKey" credential` |
| get_closed_orders | binance | ❌ 需认证 | `requires "apiKey" credential` |
| get_positions | binance | ❌ 需认证 | `requires "apiKey" credential` |
| get_my_trades | binance | ❌ 需认证 | `requires "apiKey" credential` |
| get_order | binance (fake id) | ❌ 需认证 | `requires "apiKey" credential` |
| get_ledger | binance (spot) | ⚠️ 不支持 | `fetchLedger() supports contract wallets only` |
| get_deposits | binance | ❌ 需认证 | `requires "apiKey" credential` |
| get_withdrawals | binance | ❌ 需认证 | `requires "apiKey" credential` |

---

## 四、交易操作类工具测试（需认证）

> 所有交易操作类接口均需要 API Key 认证。

| 工具 | 测试参数 | 结果 | 错误信息 |
|------|---------|------|---------|
| set_leverage | binance BTC/USDT:USDT 10x | ❌ 需认证 | `requires "apiKey" credential` |
| set_margin_mode | binance cross BTC/USDT:USDT | ❌ 需认证 | `requires "apiKey" credential` |
| cancel_order | binance fake_order_123 | ❌ 需认证 | `requires "apiKey" credential` |
| cancel_all_orders | binance BTC/USDT | ❌ 需认证 | `requires "apiKey" credential` |
| transfer | binance USDT spot→swap | ❌ 需认证 | `requires "apiKey" credential` |
| create_order | 未测试（避免真实下单） | - | - |

---

## 五、边界情况与错误处理测试

### 5.1 无效交易所
| 输入 | 结果 | 错误信息 |
|------|------|---------|
| `invalid_exchange` | ✅ 正确拒绝 | `Exchange 'invalid_exchange' not supported. Available: binance, ...` |
| `pionex` | ⚠️ 错误信息不一致 | `Exchange 'pionex' is not available in ccxt`（但 list_exchanges 包含 pionex） |

### 5.2 无效交易对
| 输入 | 结果 | 错误信息 |
|------|------|---------|
| binance `INVALID/PAIR` | ✅ 正确拒绝 | `does not have market symbol INVALID/PAIR` |
| hyperliquid `BTC/USDT` | ✅ 正确拒绝 | `does not have market symbol BTC/USDT` |
| binance funding `INVALID/PAIR:USDT` | ✅ 正确拒绝 | `does not have market symbol INVALID/PAIR:USDT` |

### 5.3 无效参数
| 输入 | 结果 | 错误信息 |
|------|------|---------|
| orderbook limit=0 | ✅ Binance 拒绝 | `Mandatory parameter 'limit' was not sent, was empty/null, or malformed` |
| ohlcv timeframe=invalid | ✅ Binance 拒绝 | `Invalid interval` |
| get_tickers symbols=[] | ⚠️ 错误信息不友好 | `does not have market symbol undefined` |

### 5.4 认证相关
| 场景 | 结果 | 错误信息 |
|------|------|---------|
| OKX 公开数据（无认证） | ❌ 也需要认证 | `Request header OK-ACCESS-PASSPHRASE incorrect` |
| Binance 公开数据（无认证） | ✅ 正常访问 | - |
| Bybit 公开数据（无认证） | ✅ 正常访问 | - |
| Binance 私有接口（无认证） | ✅ 正确报错 | `requires "apiKey" credential` |

---

## 六、跨交易所兼容性测试

| 交易所 | 公开数据 | 认证状态 | 备注 |
|--------|---------|---------|------|
| binance | ✅ 全部正常 | 未配置 API Key | 主力测试交易所 |
| binanceusdm | ✅ ticker 正常 | 未配置 | U本位合约 |
| binancecoinm | ✅ ticker 正常 | 未配置 | 币本位合约 |
| okx | ❌ 公开数据也报错 | passphrase 错误 | 即使公开接口也需要正确认证头 |
| bybit | ✅ 全部正常 | 未配置 API Key | ticker/orderbook/ohlcv/funding 均正常 |
| bitget | ✅ ticker 正常 | 未配置 | - |
| gate | ✅ ticker/trades/ohlcv 正常 | 未配置 | - |
| huobi | ✅ ticker 正常 | 未配置 | - |
| pionex | ❌ 不可用 | - | list_exchanges 包含但 ccxt 不支持 |
| hyperliquid | ✅ 全部正常 | 未配置 | 注意：spot 用 USDC，swap 用 USDC:USDC |

---

## 七、发现的问题与建议

### 🔴 Bug（需修复）

1. **pionex 在 list_exchanges 中但实际不可用**
   - `list_exchanges` 返回包含 `pionex`，但调用任何接口报错 `Exchange 'pionex' is not available in ccxt`
   - 建议：从 list_exchanges 中移除 pionex，或添加 ccxt 支持

2. **OKX 公开数据接口也需要认证**
   - get_markets、get_ticker 等公开接口也报 `OK-ACCESS-PASSPHRASE incorrect`
   - 原因：OKX ccxt 实现可能在所有请求中都带了认证头，passphrase 配置错误导致公开接口也失败
   - 建议：检查 OKX 的 passphrase 配置，或在公开接口调用时不带认证头

### 🟡 需关注（建议优化）

3. **get_tickers 传空数组报错信息不友好**
   - 传 `symbols: []` 时报 `does not have market symbol undefined`
   - 建议：增加参数校验，空数组时返回友好提示或返回全部 tickers

4. **get_open_orders 不传 symbol 触发 Binance 警告**
   - 报错：`WARNING: fetching open orders without specifying a symbol has stricter rate limits`
   - 建议：在工具描述中注明建议传 symbol 参数，或在代码中设置 `warnOnFetchOpenOrdersWithoutSymbol = false`

5. **get_ledger 在 Binance spot 不支持**
   - 报错：`fetchLedger() supports contract wallets only`
   - 建议：在工具描述中注明此限制，或自动切换到合约钱包

6. **orderbook limit=0 透传到交易所报错**
   - 建议：在 MCP 层做参数校验，limit 必须 > 0

### 🟢 表现良好

7. **无效交易所名称** → 错误信息清晰，列出所有可用交易所
8. **无效交易对** → 错误信息清晰，明确指出不存在的 symbol
9. **无效 timeframe** → 正确透传交易所错误
10. **不存在的 base 币种过滤** → 返回空数组，不报错
11. **跨交易所数据格式统一** → 所有交易所返回的 ticker/ohlcv/funding 格式一致

---

## 八、测试总结

### 整体评价：🟢 基本可用，有少量问题需修复

**公开市场数据接口**表现优秀，8/10 个交易所的公开数据可正常访问，数据格式统一规范，错误处理大部分到位。

**账户和交易接口**因当前环境未配置 API Key 无法做功能验证，但认证缺失时的错误提示清晰明确。

### 优先修复项
1. 从 `list_exchanges` 移除 `pionex`（或添加 ccxt 支持）
2. 修复 OKX 公开接口的认证问题
3. `get_tickers` 空数组参数校验

### 后续建议
- 配置至少一个交易所的 API Key（建议 Binance 测试网）后，补充账户类和交易类接口的功能测试
- 对 `create_order` 使用测试网进行下单/撤单全流程验证

