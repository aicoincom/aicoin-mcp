# AiCoin MCP

AiCoin MCP Server 合集，为 AI 客户端提供加密货币交易和行情数据能力。

## 包含项目

| 项目 | 说明 | npm 包 |
|------|------|--------|
| [trade-mcp](./trade-mcp/) | 交易 MCP（下单、撤单、查余额等） | `@aicoin/trade-mcp` |
| [opendata-mcp](./opendata-mcp/) | 行情数据 MCP（K线、快讯、鲸鱼追踪等） | `@aicoin/opendata-mcp` |

## 快速使用

用户无需 clone 本仓库，直接在 MCP 客户端配置中添加即可：

```json
{
  "mcpServers": {
    "aicoin-trade": {
      "command": "npx",
      "args": ["-y", "@aicoin/trade-mcp"],
      "env": {
        "DEFAULT_EXCHANGE": "okx",
        "OKX_API_KEY": "your_key",
        "OKX_SECRET": "your_secret",
        "OKX_PASSPHRASE": "your_passphrase"
      }
    },
    "aicoin-opendata": {
      "command": "npx",
      "args": ["-y", "@aicoin/opendata-mcp"],
      "env": {
        "AICOIN_ACCESS_KEY": "your_api_key",
        "AICOIN_ACCESS_SECRET": "your_access_key"
      }
    }
  }
}
```

## 开发

```bash
# Trade MCP
cd trade-mcp && npm install && npm run build

# OpenData MCP
cd opendata-mcp && npm install && npm run build
```

## 发布

```bash
cd trade-mcp && npm publish
cd opendata-mcp && npm publish
```
