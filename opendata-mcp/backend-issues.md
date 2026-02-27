# OpenAPI 后端问题汇总

> MCP 版本: v1.0.18 | 测试时间: 2026-02-27
> 测试 Key 等级: Professional

以下接口在 MCP 层参数已对齐文档，但后端返回 500 或空数据，需要后端排查。

---

## 一、500 错误（10个）

### 1. 币种国库相关（6个全部 500）

| 接口                                                       | 测试参数         |
| ---------------------------------------------------------- | ---------------- |
| `GET /api/upgrade/v2/coin-treasuries/summary`              | `coin=BTC`       |
| `POST /api/upgrade/v2/coin-treasuries/entities`            | `{"coin":"BTC"}` |
| `POST /api/upgrade/v2/coin-treasuries/history`             | `{"coin":"BTC"}` |
| `POST /api/upgrade/v2/coin-treasuries/history/accumulated` | `{"coin":"BTC"}` |
| `GET /api/upgrade/v2/coin-treasuries/latest/entities`      | `coin=BTC`       |
| `GET /api/upgrade/v2/coin-treasuries/latest/history`       | `coin=BTC`       |

> 整组 coin-treasuries 接口全部 500，可能是同一个底层问题。

### 2. 其他 500

| 接口                                                        | 测试参数              |
| ----------------------------------------------------------- | --------------------- |
| `GET /api/v2/mix/stock-market`                              | 无业务参数            |
| `GET /api/v2/signal/changeSignal`                           | 无业务参数 / `type=1` |
| `GET /api/upgrade/v2/hyperliquid/top-trades`                | 默认参数              |
| `GET /api/upgrade/v2/hyperliquid/liquidation/top-positions` | 默认参数              |

---

## 二、空数据（5个）

### 1. get_trading_pair

- 接口: `GET /api/v2/trading-pair/getTradingPair`
- 参数: 无（文档无业务参数）
- 现象: `data` 为空数组

### 2. get_super_depth_history

- 接口: `GET /api/upgrade/v2/futures/super-depth/history`
- 参数: `key=btcswapusdt:okcoinfutures`
- 现象: `data` 为空

### 3. get_funding_rate_history

- 接口: `GET /api/upgrade/v2/futures/funding-rate/history`
- 参数: `symbol=btcswapusdt:okcoinfutures, interval=1h`
- 现象: `data` 为空

### 4. get_weighted_funding_rate_history

- 接口: `GET /api/upgrade/v2/futures/funding-rate/vol-weight-history`
- 参数: `symbol=btcswapusdt, interval=1h`
- 现象: `data` 为空

### 5. get_gray_scale

- 接口: `GET /api/v2/mix/gray-scale`
- 参数: `coins=btc,eth`
- 现象: 返回结构正常但字段值全为空字符串

---
