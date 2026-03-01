# @aicoin/mcp

AiCoin 统一 MCP 服务器 — 加密货币行情数据 + 交易执行，一个包搞定。

将 `@aicoin/opendata-mcp`（AiCoin API 行情数据）和 `@aicoin/trade-mcp`（CCXT 交易执行）合并为 **41 个工具**，通过 `action` 参数路由实现功能完整保留。

## 快速开始

### 仅使用行情数据（无需交易所密钥）

```json
{
  "mcpServers": {
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "<你的 OpenData Key>",
        "AICOIN_ACCESS_SECRET": "<你的 OpenData Secret>"
      }
    }
  }
}
```

> 不配置 AiCoin 密钥也可使用，内置免费 Key（IP 限速 10 次/分钟）。

### 行情 + 交易（完整配置）

```json
{
  "mcpServers": {
    "aicoin": {
      "command": "npx",
      "args": ["-y", "@aicoin/mcp"],
      "env": {
        "AICOIN_ACCESS_KEY_ID": "<你的 OpenData Key>",
        "AICOIN_ACCESS_SECRET": "<你的 OpenData Secret>",
        "DEFAULT_EXCHANGE": "binance",
        "BINANCE_API_KEY": "<你的交易所 Key>",
        "BINANCE_SECRET": "<你的交易所 Secret>",
        "USE_PROXY": "true",
        "PROXY_URL": "http://127.0.0.1:7890"
      }
    }
  }
}
```

## 环境变量

### AiCoin OpenData API

| 变量 | 必填 | 说明 |
|------|------|------|
| `AICOIN_ACCESS_KEY_ID` | 否 | AiCoin OpenData API Key（不填则使用内置免费 Key） |
| `AICOIN_ACCESS_SECRET` | 否 | AiCoin OpenData API Secret |

**API 等级**：Basic(免费) → Normal(¥99/月) → Premium(¥299/月) → Professional(¥999/月)

注册地址：https://www.aicoin.com/opendata

### 交易所（CCXT）

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEFAULT_EXCHANGE` | 否 | 默认交易所（默认 binance） |
| `{EXCHANGE}_API_KEY` | 交易时需要 | 交易所 API Key |
| `{EXCHANGE}_SECRET` | 交易时需要 | 交易所 API Secret |
| `{EXCHANGE}_PASSPHRASE` | OKX/Bitget | 交易所 Passphrase |
| `EXCHANGE_TIMEOUT` | 否 | 请求超时毫秒数（默认 30000） |

**支持交易所**：`binance` `binanceusdm` `binancecoinm` `okx` `bybit` `bitget` `gate` `huobi` `hyperliquid`

> 所有交易所 API Key 仅存储在本地 MCP 配置中，不会上传到 AiCoin 服务器。

### 代理

| 变量 | 必填 | 说明 |
|------|------|------|
| `USE_PROXY` | 否 | 启用代理（true/false） |
| `PROXY_URL` | 否 | 代理地址，支持 http/https/socks5（默认 `http://127.0.0.1:7890`） |

常见代理端口：Clash 7890、V2Ray 10808、Shadowsocks 1080

## 工具列表（41 个）

### 一、交易模块（11 个）— CCXT 交易所交易

| # | 工具名 | 说明 | Actions |
|---|--------|------|---------|
| 1 | `exchange_info` | 交易所信息 | `exchanges` 列出所有支持的交易所；`markets` 查询交易对 |
| 2 | `exchange_ticker` | 实时行情 | 提供 `symbol` 返回单个；提供 `symbols` 或不填返回批量 |
| 3 | `exchange_market_data` | 交易所市场数据 | `orderbook` 盘口深度；`trades` 最新成交；`ohlcv` K 线 |
| 4 | `exchange_funding` | 资金费率 | `current` 当前费率；`history` 历史费率 |
| 5 | `account_status` | 账户状态 | `balance` 余额；`positions` 持仓（合约） |
| 6 | `account_orders` | 订单查询 | `open` 挂单；`closed` 已完成；`by_id` 单个订单；`my_trades` 成交记录 |
| 7 | `account_history` | 账户历史 | `ledger` 流水；`deposits` 充值；`withdrawals` 提现 |
| 8 | `create_order` | 下单 | 支持 market/limit，buy/sell，可设置 pos_side 和 margin_mode |
| 9 | `cancel_order` | 撤单 | 指定 `order_id` 撤单个；设置 `cancel_all=true` 撤全部 |
| 10 | `set_trading_config` | 交易配置 | `leverage` 设置杠杆；`margin_mode` 设置全仓/逐仓 |
| 11 | `transfer` | 划转 | 账户间资金划转（现货 ↔ 合约） |

### 二、币种模块（5 个）— AiCoin 币种数据

| # | 工具名 | 说明 | Actions / 参数 |
|---|--------|------|----------------|
| 12 | `coin_info` | 币种信息 | `list` 币种列表；`ticker` 实时价格；`config` 币种简介；`ai_analysis` AI 解读 |
| 13 | `coin_funding_rate` | 资金费率历史 | `weighted=true` 切换为成交量加权费率 |
| 14 | `coin_liquidation` | 爆仓数据 | `map` 爆仓热力图；`history` 爆仓记录；`estimated` 预估爆仓 |
| 15 | `coin_open_interest` | 持仓量历史 | `margin_type`: `stablecoin`(U 本位) / `coin`(币本位) |
| 16 | `coin_futures_data` | 合约深度与成交 | `historical_depth` 深度历史；`super_depth` 大单深度；`trade_data` 最新成交 |

### 三、资讯模块（2 个）— 新闻与快讯

| # | 工具名 | 说明 | Actions |
|---|--------|------|---------|
| 17 | `news` | 新闻文章 | `list` 文章列表；`detail` 文章详情；`rss` RSS 订阅 |
| 18 | `flash` | 快讯 | `newsflash` AiCoin 快讯；`list` 行业快讯；`exchange_listing` 上币/下币 |

### 四、行情模块（6 个）— 行情与指数

| # | 工具名 | 说明 | Actions |
|---|--------|------|---------|
| 19 | `market_info` | 交易所/平台数据 | `exchanges` 平台列表；`ticker` 平台行情；`hot_coins` 热门币种；`futures_interest` 合约持仓 |
| 20 | `kline` | K 线数据 | `data` 标准 K 线；`indicator` 指标 K 线；`trading_pair` 指标 K 线交易对 |
| 21 | `index_data` | 指数数据 | `price` 指数价格；`info` 指数详情；`list` 指数列表 |
| 22 | `crypto_stock` | 加密概念股 | `quotes` 股票报价；`top_gainer` 涨幅榜；`company` 公司详情 |
| 23 | `coin_treasury` | 机构持仓 | `entities` 持仓实体；`history` 交易历史；`accumulated` 累计数据；`latest_entities` 最新持仓；`latest_history` 最新交易；`summary` 概览 |
| 24 | `depth` | 盘口深度 | `latest` 实时快照；`full` 完整深度；`grouped` 按价格聚合 |

### 五、特色功能模块（5 个）— 信号与分析

| # | 工具名 | 说明 | Actions |
|---|--------|------|---------|
| 25 | `market_overview` | 市场总览 | `nav` 导航数据；`ls_ratio` 多空比；`liquidation` 爆仓；`grayscale_trust` 灰度信托；`gray_scale` 灰度持仓；`stock_market` 概念股 |
| 26 | `order_flow` | 订单流 | `big_orders` 大单追踪；`agg_trades` 聚合大单 |
| 27 | `trading_pair` | 交易对 | `ticker` 交易对行情；`by_market` 按平台查询；`list` 交易对列表 |
| 28 | `signal_data` | 信号数据 | `strategy` 策略信号；`alert` 预警数据；`config` 预警配置；`alert_list` 预警列表；`change` 异动信号 |
| 29 | `signal_manage` | 预警管理 | `add` 添加预警；`delete` 删除预警 |

### 六、Hyperliquid 模块（11 个）— HL 专属分析

| # | 工具名 | 说明 | Actions |
|---|--------|------|---------|
| 30 | `hl_ticker` | HL 行情 | 提供 `coin` 返回单个，不填返回 Top 50 |
| 31 | `hl_whale` | 鲸鱼数据 | `positions` 持仓；`events` 事件；`directions` 多空数量；`history_ratio` 历史多空比 |
| 32 | `hl_liquidation` | 爆仓数据 | `history` 历史；`stats` 统计；`stats_by_coin` 按币种；`top_positions` 大额爆仓 |
| 33 | `hl_open_interest` | 持仓量 | `summary` 总览；`top_coins` 排行；`history` 历史 |
| 34 | `hl_taker` | Taker 数据 | `delta` 累计买卖差值；`klines` 带 Taker 量 K 线 |
| 35 | `hl_trader` | 交易者分析 | `stats` 统计；`best_trades` 最佳交易；`performance` 币种表现；`completed_trades` 已完成交易；`accounts` 批量账户；`statistics` 批量统计 |
| 36 | `hl_fills` | 成交记录 | `by_address` 按地址；`by_oid` 按订单ID；`by_twapid` 按TWAP ID；`top_trades` 大额成交 |
| 37 | `hl_orders` | 订单 | `latest` 最新；`by_oid` 按ID；`filled` 已成交；`filled_by_oid` 已成交按ID；`top_open` 大额挂单；`active_stats` 活跃统计；`twap_states` TWAP 状态 |
| 38 | `hl_position` | 仓位数据 | `current_history` 当前仓位历史；`completed_history` 已平仓历史；`current_pnl`/`completed_pnl` 盈亏；`current_executions`/`completed_executions` 执行记录 |
| 39 | `hl_portfolio` | 组合数据 | `portfolio` 账户曲线；`pnls` 盈亏曲线；`max_drawdown` 最大回撤；`net_flow` 净流入 |
| 40 | `hl_advanced` | 高级功能 | `info` 通用 API；`smart_find` 聪明钱发现；`discover` 交易者发现 |

### 七、引导模块（1 个）

| # | 工具名 | 说明 | Actions |
|---|--------|------|---------|
| 41 | `guide` | 设置引导 | `api_key` 获取 API Key；`upgrade` 升级套餐；`trade_setup` 交易所配置 |

## 合并映射

本项目由两个独立 MCP 服务器合并而来：

| 来源 | 原工具数 | 合并后 | 策略 |
|------|---------|--------|------|
| opendata-mcp | 108 | 30 | action 参数路由 |
| trade-mcp | 24 | 11 | action 参数路由 |
| **合计** | **132** | **41** | 功能完整保留 |

**核心策略**：同一领域的多个工具合并为一个，用 `action: z.enum([...])` 参数区分子功能。所有原始 API 端点和参数完整保留，零功能丢失。

## 测试

```bash
npm run build
node test-tools.mjs              # 测试全部工具
node test-tools.mjs hl_           # 只测 Hyperliquid
node test-tools.mjs coin          # 只测币种相关
node test-tools.mjs exchange      # 只测交易所相关
```

测试结果分类：
- `OK` — 正常返回
- `403` — 需要更高 API 等级
- `EXPECTED` — 预期的空数据（如无当前持仓）
- `ERROR` — 异常错误
- `CRASH` — 程序崩溃

## 开发

```bash
npm install            # 安装依赖
npm run dev            # 监听模式开发
npm run build          # 生产构建
npm start              # 运行服务器
```

### 项目结构

```
aicoin-mcp/
├── src/
│   ├── index.ts                  # 主入口
│   ├── client/
│   │   ├── api.ts                # AiCoin API 客户端（自动签名）
│   │   └── signature.ts          # HmacSHA1 签名
│   ├── exchange/
│   │   ├── manager.ts            # CCXT 实例管理（缓存 + 代理）
│   │   └── broker.ts             # AiCoin Broker ID 配置（返佣追踪）
│   └── tools/
│       ├── index.ts              # 工具注册入口
│       ├── utils.ts              # 响应助手（截断、格式化）
│       ├── trade.ts              # 交易模块（11 个工具）
│       ├── coins.ts              # 币种模块（5 个工具）
│       ├── contents.ts           # 资讯模块（2 个工具）
│       ├── markets.ts            # 行情模块（6 个工具）
│       ├── features.ts           # 特色功能（5 个工具）
│       ├── hyperliquid.ts        # Hyperliquid（11 个工具）
│       └── guide.ts              # 引导模块（1 个工具）
├── package.json
├── tsconfig.json
├── test-tools.mjs                # 一键测试脚本
└── README.md
```

## License

MIT
