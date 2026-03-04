# @aicoin/aicoin-mcp

AiCoin MCP 服务器 — 加密货币实时行情数据 + 多交易所交易，41 个工具。

[English](./README.md) | 中文

## 快速开始

开箱即用，内置免费 API Key（15 次/分钟，IP 限速）。

### Claude Code

```bash
claude mcp add aicoin -- npx -y @aicoin/aicoin-mcp
```

### 其他 MCP 客户端

添加到 MCP 配置（`.mcp.json`、`claude_desktop_config.json` 等）：

```json
{
  "mcpServers": {
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/aicoin-mcp"]
    }
  }
}
```

### 使用自己的 API Key（可选）

获取更高频率限制，前往 [aicoin.com/opendata](https://www.aicoin.com/opendata) 注册：

```json
{
  "mcpServers": {
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/aicoin-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "your-key-id",
        "AICOIN_ACCESS_SECRET": "your-secret"
      }
    }
  }
}
```

## 开启交易功能（可选）

添加交易所 API Key 即可下单、查余额、管理仓位：

```json
{
  "env": {
    "AICOIN_ACCESS_KEY_ID": "your-key-id",
    "AICOIN_ACCESS_SECRET": "your-secret",
    "DEFAULT_EXCHANGE": "okx",
    "OKX_API_KEY": "your-exchange-key",
    "OKX_SECRET": "your-exchange-secret",
    "OKX_PASSPHRASE": "your-passphrase"
  }
}
```

> 交易所 API Key 仅存储在本地，不会上传到 AiCoin 服务器。

**支持交易所**：Binance、Binance USDM、Binance COINM、OKX、Bybit、Bitget、Gate、Huobi、Hyperliquid

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `AICOIN_ACCESS_KEY_ID` | 否 | AiCoin API Key（不填则使用内置免费 Key） |
| `AICOIN_ACCESS_SECRET` | 否 | AiCoin API Secret |
| `DEFAULT_EXCHANGE` | 否 | 默认交易所（默认 binance） |
| `{EXCHANGE}_API_KEY` | 交易时需要 | 交易所 API Key |
| `{EXCHANGE}_SECRET` | 交易时需要 | 交易所 API Secret |
| `{EXCHANGE}_PASSPHRASE` | OKX/Bitget | 交易所 Passphrase |
| `USE_PROXY` | 否 | 启用代理（true/false） |
| `PROXY_URL` | 否 | 代理地址（默认 `http://127.0.0.1:7890`） |

## API 套餐

| 套餐 | 价格 | 频率限制 | 月请求量 |
|------|------|---------|---------|
| Free（免费版） | $0/永久 | 15 次/分钟 | 2 万次 |
| Basic（基础版） | $29/月 | 30 次/分钟 | 2 万次 |
| Standard（标准版） | $79/月 | 80 次/分钟 | 50 万次 |
| Advanced（高级版） | $299/月 | 300 次/分钟 | 150 万次 |
| Professional（专业版） | $699/月 | 1200 次/分钟 | 350 万次 |

注册地址：https://www.aicoin.com/opendata

## 工具列表（41 个）

### 行情数据（30 个）

| 工具 | 说明 |
|------|------|
| `coin_info` | 币种列表、实时价格、简介、AI 分析 |
| `coin_funding_rate` | 资金费率历史（按交易所或成交量加权） |
| `coin_liquidation` | 爆仓热力图、历史、预估爆仓 |
| `coin_open_interest` | 聚合持仓量历史（U 本位 / 币本位） |
| `coin_futures_data` | 合约深度历史、大单、成交数据 |
| `market_info` | 交易所列表、平台行情、热门币种、合约持仓排行 |
| `kline` | 标准 K 线、指标 K 线、交易对发现 |
| `index_data` | 指数价格、详情、列表 |
| `crypto_stock` | 加密概念股报价、涨幅榜、公司详情 |
| `coin_treasury` | 机构持仓（实体、交易历史、累计） |
| `depth` | 实时盘口快照（最新、完整、分组） |
| `market_overview` | 市场总览、多空比、爆仓、灰度、概念股 |
| `order_flow` | 大单追踪、聚合大额成交 |
| `trading_pair` | 交易对行情、按平台查询、筛选 |
| `signal_data` | 策略信号、预警、异动 |
| `signal_manage` | 预警管理 |
| `news` | 新闻文章列表、详情、RSS |
| `flash` | 快讯、行业快讯、上币公告 |
| `hl_ticker` | Hyperliquid 行情 |
| `hl_whale` | HL 鲸鱼持仓、事件、多空方向 |
| `hl_liquidation` | HL 爆仓历史、统计、大额爆仓 |
| `hl_open_interest` | HL 持仓量总览、排行、历史 |
| `hl_taker` | HL Taker 买卖差值、K 线 |
| `hl_trader` | HL 交易者统计、最佳交易、表现 |
| `hl_fills` | HL 成交记录（按地址/订单/TWAP） |
| `hl_orders` | HL 订单（最新、已成交、大额挂单） |
| `hl_position` | HL 仓位历史、盈亏、执行记录 |
| `hl_portfolio` | HL 账户曲线、最大回撤、净流入 |
| `hl_advanced` | HL 通用 API、聪明钱发现 |
| `guide` | API Key 设置、套餐升级、交易所配置引导 |

### 交易所交易（11 个）

| 工具 | 说明 |
|------|------|
| `exchange_info` | 列出支持的交易所、查询交易对 |
| `exchange_ticker` | 实时行情（单个或批量） |
| `exchange_market_data` | 盘口深度、最近成交、OHLCV K 线 |
| `exchange_funding` | 当前和历史资金费率 |
| `account_status` | 账户余额和持仓 |
| `account_orders` | 查询挂单/历史订单/成交记录 |
| `account_history` | 账户流水、充值、提现 |
| `create_order` | 下单（市价/限价） |
| `cancel_order` | 撤单（单个或全部） |
| `set_trading_config` | 设置杠杆和保证金模式 |
| `transfer` | 账户间划转（现货/合约） |

## License

MIT
