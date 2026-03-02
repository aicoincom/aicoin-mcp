# AiCoin API 套餐功能对照表

> 生成日期：2026-03-02 | 基于 v1.0.4 实测数据（104 个 AiCoin API 接口）
> CCXT 交易工具（11 个）直连交易所，不经 AiCoin API，所有套餐均可使用

---

## 总览

| 套餐 | 价格 | 频率限制 | 可用接口数 | 定位 |
|------|------|---------|:---------:|------|
| Free（内置） | 免费 | 10 req/min | 9 | 基础行情 |
| Basic（基础版） | 免费（需注册） | 10 req/min | 24 | 行情研究 |
| Normal（标准版） | ¥99/月 | 60 req/min | 71 | 专业交易 |
| Premium（高级版） | ¥299/月 | 120 req/min | 79 | 深度分析 |
| Professional（专业版） | ¥999/月 | 300 req/min | 103 | 机构级全量 |

---

## Free（内置免费 key） — 9 个接口

开箱即用，无需注册。

| 接口 | Action | 数据含义 |
|------|--------|---------|
| coin_info | ticker | 币种实时价格（当前价、涨跌幅、24h 成交量） |
| market_info | exchanges | 交易所列表（支持的交易平台清单） |
| market_info | hot_coins | 热门币种分类（GameFi、DeFi、Meme 等板块热门币） |
| kline | data | 标准 K 线（任意交易对的 OHLCV 蜡烛图数据） |
| news | rss | RSS 新闻流（广场资讯列表） |
| trading_pair | ticker | 交易对实时行情（指定交易对的价格和成交量） |
| hl_ticker | all | Hyperliquid 全量行情（所有币种 ticker） |
| hl_ticker | single | Hyperliquid 单币行情（指定币种 ticker） |
| hl_advanced | info | Hyperliquid 通用信息（元数据、资产上下文、所有中间价） |

---

## Basic（基础版，免费注册） — 24 个接口

包含 Free 全部 9 个 + 新增 15 个。

### 新增接口

| 接口 | Action | 数据含义 |
|------|--------|---------|
| coin_info | list | 全部币种列表（市值排名、基本属性） |
| coin_info | config | 币种详情档案（简介、官网、社交媒体、白皮书） |
| market_info | ticker | 交易所级别行情（指定平台的全量 ticker） |
| market_info | futures_interest | 合约持仓排行（各币种合约未平仓量排名） |
| news | list | 新闻文章列表（分页浏览资讯标题和摘要） |
| flash | list | 行业快讯（带分类标签的实时快讯流） |
| market_overview | nav | 市场总览（BTC 市占率、总市值、恐贪指数等） |
| market_overview | ls_ratio | 多空比（全网合约多空持仓人数比例） |
| trading_pair | by_market | 平台交易对（指定交易所的所有交易对列表） |
| trading_pair | list | 交易对筛选（按币种/计价货币过滤交易对） |
| coin_funding_rate | default | 资金费率历史（指定交易所的合约资金费率走势） |
| coin_futures_data | trade_data | 合约成交数据（最新逐笔成交记录） |
| hl_fills | top_trades | HL 大额成交（Hyperliquid 最大成交单排行） |
| hl_orders | top_open | HL 大额挂单（Hyperliquid 最大未成交订单） |
| hl_orders | active_stats | HL 活跃订单统计（买卖挂单量分布） |

---

## Normal（标准版，¥99/月） — 71 个接口

包含 Basic 全部 24 个 + 新增 47 个。覆盖大单追踪、信号系统、Hyperliquid 全链分析。

### 新增接口

| 接口 | Action | 数据含义 |
|------|--------|---------|
| **内容** | | |
| flash | newsflash | AiCoin 快讯（AiCoin 自有的实时快讯推送） |
| **市场概览** | | |
| market_overview | grayscale_trust | 灰度信托基金（GBTC 等信托溢价/折价数据） |
| market_overview | gray_scale | 灰度持仓（灰度各币种持仓量变化） |
| **订单流** | | |
| order_flow | big_orders | 大单追踪（合约大额委托单监控） |
| order_flow | agg_trades | 聚合大额成交（大额成交汇总统计） |
| **信号系统** | | |
| signal_data | strategy | 策略信号（指标胜率信号，如 TD 序列买入信号） |
| signal_data | alert | 信号提醒（当前触发的各类信号） |
| signal_data | config | 信号配置（可用的信号提醒类型和参数） |
| signal_data | change | 异动信号（价格异常波动监控） |
| **盘口深度** | | |
| depth | latest | 实时盘口快照（最新买卖盘深度数据） |
| **HL 鲸鱼追踪** | | |
| hl_whale | positions | HL 巨鲸持仓（鲸鱼当前持仓列表） |
| hl_whale | events | HL 巨鲸动态（最新鲸鱼操作事件） |
| hl_whale | directions | HL 多空方向（鲸鱼多空持仓人数统计） |
| hl_whale | history_ratio | HL 历史多头比例（鲸鱼多头比例走势） |
| **HL 爆仓** | | |
| hl_liquidation | history | HL 爆仓历史（逐笔爆仓记录） |
| hl_liquidation | stats | HL 爆仓统计（多空爆仓金额汇总） |
| hl_liquidation | stats_by_coin | HL 按币种爆仓（各币种爆仓金额统计） |
| hl_liquidation | top_positions | HL 最大爆仓（最大爆仓仓位排行） |
| **HL Taker** | | |
| hl_taker | klines | HL Taker K 线（带主动买卖量的 K 线图） |
| **HL 交易员** | | |
| hl_trader | stats | HL 交易员统计（胜率、盈亏、交易次数） |
| hl_trader | best_trades | HL 最佳交易（最高盈利的历史交易） |
| hl_trader | performance | HL 按币种表现（各币种的盈亏分布） |
| hl_trader | completed_trades | HL 已完成交易（历史成交列表） |
| hl_trader | accounts | HL 批量账户（批量查询多个钱包信息） |
| hl_trader | statistics | HL 批量统计（批量查询多个钱包统计） |
| **HL 成交** | | |
| hl_fills | by_address | HL 按地址查成交（指定钱包的成交明细） |
| hl_fills | by_oid | HL 按订单查成交（指定订单 ID 的成交明细） |
| hl_fills | by_twapid | HL 按 TWAP 查成交（指定 TWAP ID 的成交明细） |
| **HL 订单** | | |
| hl_orders | latest | HL 最新订单（指定钱包的最新委托） |
| hl_orders | by_oid | HL 按 ID 查单（指定订单 ID 详情） |
| hl_orders | filled | HL 已成交订单（指定钱包的已成交订单） |
| hl_orders | filled_by_oid | HL 按 ID 查已成交（指定订单 ID 的成交详情） |
| hl_orders | twap_states | HL TWAP 状态（指定钱包的 TWAP 订单状态） |
| **HL 仓位** | | |
| hl_position | current_history | HL 当前仓位历史（当前持仓的历史变化） |
| hl_position | completed_history | HL 已平仓历史（已关闭仓位的历史记录） |
| hl_position | current_pnl | HL 当前仓位盈亏（当前持仓的 PnL 曲线） |
| hl_position | completed_pnl | HL 已平仓盈亏（已关闭仓位的 PnL 曲线） |
| hl_position | current_executions | HL 当前仓位执行（当前持仓的执行轨迹） |
| hl_position | completed_executions | HL 已平仓执行（已关闭仓位的执行轨迹） |
| **HL 投资组合** | | |
| hl_portfolio | portfolio | HL 账户价值曲线（账户净值随时间变化） |
| hl_portfolio | pnls | HL PnL 曲线（累计盈亏走势图） |
| hl_portfolio | max_drawdown | HL 最大回撤（指定时间段的最大回撤） |
| hl_portfolio | net_flow | HL 净流入（账户资金净流入/流出） |
| **HL 高级** | | |
| hl_advanced | smart_find | HL 聪明钱发现（发现高胜率的智能钱包地址） |

---

## Premium（高级版，¥299/月） — 79 个接口

包含 Normal 全部 71 个 + 新增 8 个。增加指标 K 线、指数系统、爆仓热力图、完整盘口。

### 新增接口

| 接口 | Action | 数据含义 |
|------|--------|---------|
| **K 线指标** | | |
| kline | indicator | 指标 K 线（带技术指标叠加的 K 线数据） |
| kline | trading_pair | 指标交易对（支持指标 K 线的交易对列表） |
| **指数系统** | | |
| index_data | price | 指数价格（指数实时价格数据） |
| index_data | info | 指数详情（指数描述、成分、计算方式） |
| index_data | list | 指数列表（全部可用指数清单） |
| **爆仓深度** | | |
| market_overview | liquidation | 全网爆仓概览（按币种/平台汇总的爆仓金额） |
| coin_liquidation | history | 爆仓历史（合约爆仓订单的历史记录） |
| coin_liquidation | map | 爆仓热力图（价格区间的爆仓密度分布） |
| **完整盘口** | | |
| depth | full | 完整盘口（全量买卖盘深度数据） |
| depth | grouped | 分组盘口（按价格区间聚合的深度数据） |
| **HL 持仓量** | | |
| hl_open_interest | summary | HL 持仓概览（全平台 OI 汇总） |
| hl_open_interest | top_coins | HL OI 排行（按持仓量排名的币种） |
| **HL Taker** | | |
| hl_taker | delta | HL Taker Delta（累计主动买卖差值曲线） |
| **HL 高级** | | |
| hl_advanced | discover | HL 交易员发现（按条件筛选优质交易员） |

---

## Professional（专业版，¥999/月） — 103 个接口

包含 Premium 全部 79 个 + 新增 24 个。全量数据访问，包括 AI 分析、企业持仓、概念股、超级深度。

### 新增接口

| 接口 | Action | 数据含义 |
|------|--------|---------|
| **AI 分析** | | |
| coin_info | ai_analysis | AI 币种分析（AI 对币种走势的预测解读） |
| **内容** | | |
| flash | exchange_listing | 上币/退币公告（交易所新上币和退市公告） |
| **市场概览** | | |
| market_overview | stock_market | 加密概念股行情（美股/港股加密概念股总览） |
| **信号管理** | | |
| signal_data | alert_list | 用户信号列表（已设置的信号提醒列表） |
| signal_manage | delete | 删除信号（删除已设置的信号提醒） |
| **高级资金费率** | | |
| coin_funding_rate | weighted | 加权资金费率（按成交量加权的跨所资金费率） |
| **高级爆仓** | | |
| coin_liquidation | estimated | 预估爆仓图（预估爆仓价格分布） |
| **聚合持仓量** | | |
| coin_open_interest | stablecoin | 聚合 OI（稳定币计价的全网聚合持仓量历史） |
| coin_open_interest | coin | 聚合 OI（币本位计价的全网聚合持仓量历史） |
| **超级深度** | | |
| coin_futures_data | historical_depth | 合约历史盘口（历史挂单深度数据） |
| coin_futures_data | super_depth | 超级深度（>$10k 大额挂单追踪） |
| **加密概念股** | | |
| crypto_stock | quotes | 概念股报价（MSTR、COIN 等实时股价） |
| crypto_stock | top_gainer | 概念股涨幅榜（涨幅最大的加密概念股） |
| crypto_stock | company | 概念股公司详情（公司简介、持仓、财务数据） |
| **企业持仓** | | |
| coin_treasury | entities | 持仓实体（持有 BTC/ETH 的公司和机构列表） |
| coin_treasury | history | 持仓交易历史（机构买入/卖出记录） |
| coin_treasury | accumulated | 累计持仓（机构累计持仓量走势） |
| coin_treasury | latest_entities | 最新持仓实体（最近更新的持仓机构） |
| coin_treasury | latest_history | 最新交易记录（最近的机构交易动态） |
| coin_treasury | summary | 持仓汇总（全部机构持仓概览统计） |
| **HL 持仓量历史** | | |
| hl_open_interest | history | HL OI 历史（单币种持仓量历史走势） |

---

## 附：CCXT 交易工具（所有套餐可用）

以下 11 个工具直连交易所，不经 AiCoin API，无套餐限制，只需配置交易所 API Key。

| 工具 | 功能 |
|------|------|
| exchange_info | 列出支持的交易所、查询交易对 |
| exchange_ticker | 实时行情（单个或批量） |
| exchange_market_data | 盘口深度、最近成交、OHLCV K 线 |
| exchange_funding | 当前和历史资金费率 |
| account_status | 账户余额和持仓 |
| account_orders | 查询挂单/历史订单/成交记录 |
| account_history | 账户流水、充值、提现记录 |
| create_order | 下单（市价/限价） |
| cancel_order | 撤单（单个或全部） |
| set_trading_config | 设置杠杆和保证金模式 |
| transfer | 账户间划转（现货/合约） |

---

> 支持的交易所：Binance、Binance USDM、Binance COINM、OKX、Bybit、Bitget、Gate、Huobi、Hyperliquid
>
> 升级套餐：[aicoin.com/opendata](https://www.aicoin.com/opendata)，升级后已有 Key 自动生效。
