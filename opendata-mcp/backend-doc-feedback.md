# OpenData API 文档 & 后端问题反馈

> 测试时间: 2026-02-27
> MCP 版本: v1.0.26
> 测试 Key: Professional 级别

---

## 一、文档需更新（4个）

### 1. funding-rate/history — interval 支持范围不准确

- 接口: `GET /api/upgrade/v2/futures/funding-rate/history`
- 文档写的 interval: `1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w`
- 实际有数据的 interval: `5m, 15m, 30m, 8h`
- 返回空数据的 interval: `1h, 4h, 1d`（未测全部）

建议: 文档标注哪些 interval 实际可用，或说明资金费率结算周期为 8h，部分聚合周期无数据。

### 2. vol-weight-history — 同上

- 接口: `GET /api/upgrade/v2/futures/funding-rate/vol-weight-history`
- 同样的问题，文档列了全部 interval，但只有 `5m, 15m, 30m, 8h` 有数据

### 3. getTradingPair — 缺少 market 参数说明

- 接口: `GET /api/v2/trading-pair/getTradingPair`
- 文档未说明需要 `market` 参数（平台主键）
- 不传 `market` 时 `data` 返回空数组

建议: 文档补充 `market` 参数说明，标注为必填。

### 4. aggregated-stablecoin-history — interval 支持范围不准确

- 接口: `GET /api/upgrade/v2/futures/open-interest/aggregated-stablecoin-history`
- 文档写的 interval: `1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w`
- 测试用 `1h` 返回空数据，改用 `15m` 正常返回
- 建议: 文档明确标注仅支持 `1m, 2m, 15m, 30m`，其他值返回空

---

## 二、后端问题（2个）

### 1. hl/fills/top-trades — 500 错误

- 接口: `GET /api/upgrade/v2/hl/fills/top-trades`
- 参数: `symbol=HYPE, limit=10`
- 现象: 返回 HTTP 500
- 备注: 多次测试均 500，非偶发

### 2. hl/liquidation/top-positions — 500 错误

- 接口: `GET /api/upgrade/v2/hl/liquidation/top-positions`
- 参数: `symbol=HYPE, limit=10`
- 现象: 返回 HTTP 500
- 备注: 同上
