/**
 * Public market data tools - no API key required
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getExchange, SUPPORTED_EXCHANGES } from '../exchange/manager.js';

export function registerPublicTools(server: McpServer) {
  server.tool(
    'list_exchanges',
    'List all supported cryptocurrency exchanges',
    {},
    async () => ({
      content: [{ type: 'text', text: JSON.stringify(SUPPORTED_EXCHANGES) }],
    })
  );

  server.tool(
    'get_ticker',
    'Get real-time ticker for a trading pair',
    {
      exchange: z.string().describe('Exchange ID, e.g. binance, okx, bybit'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      market_type: z
        .enum(['spot', 'future', 'swap'])
        .optional()
        .describe('Market type, default spot'),
    },
    async ({ exchange, symbol, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        const ticker = await ex.fetchTicker(symbol);
        return { content: [{ type: 'text', text: JSON.stringify(ticker) }] };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_orderbook',
    'Get order book depth for a trading pair',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      limit: z.number().optional().default(20).describe('Depth limit'),
    },
    async ({ exchange, symbol, limit }) => {
      try {
        const ex = getExchange(exchange);
        const book = await ex.fetchOrderBook(symbol, limit);
        return { content: [{ type: 'text', text: JSON.stringify(book) }] };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_trades',
    'Get recent trades for a trading pair',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      limit: z.number().optional().default(50).describe('Number of trades'),
    },
    async ({ exchange, symbol, limit }) => {
      try {
        const ex = getExchange(exchange);
        const trades = await ex.fetchTrades(symbol, undefined, limit);
        return { content: [{ type: 'text', text: JSON.stringify(trades) }] };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_markets',
    'Get all available trading pairs on an exchange',
    {
      exchange: z.string().describe('Exchange ID'),
      market_type: z
        .enum(['spot', 'future', 'swap'])
        .optional()
        .describe('Filter by market type'),
    },
    async ({ exchange, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        await ex.loadMarkets();
        const markets = Object.values(ex.markets).map(m => ({
          symbol: m.symbol,
          base: m.base,
          quote: m.quote,
          type: m.type,
          active: m.active,
        }));
        return { content: [{ type: 'text', text: JSON.stringify(markets) }] };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_funding_rates',
    'Get current funding rates for perpetual contracts',
    {
      exchange: z.string().describe('Exchange ID'),
      symbols: z
        .array(z.string())
        .optional()
        .describe('Trading pairs to query, e.g. ["BTC/USDT:USDT"]'),
    },
    async ({ exchange, symbols }) => {
      try {
        const ex = getExchange(exchange, 'swap');
        const rates = symbols
          ? await ex.fetchFundingRates(symbols)
          : await ex.fetchFundingRates();
        return { content: [{ type: 'text', text: JSON.stringify(rates) }] };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_tickers',
    'Get tickers for multiple trading pairs at once',
    {
      exchange: z.string().describe('Exchange ID'),
      symbols: z
        .array(z.string())
        .optional()
        .describe('Trading pairs, e.g. ["BTC/USDT","ETH/USDT"]'),
      market_type: z
        .enum(['spot', 'future', 'swap'])
        .optional()
        .describe('Market type, default spot'),
    },
    async ({ exchange, symbols, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        const tickers = await ex.fetchTickers(symbols);
        return { content: [{ type: 'text', text: JSON.stringify(tickers) }] };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_funding_rate_history',
    'Get historical funding rates for a perpetual contract',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT:USDT'),
      limit: z.number().optional().default(100).describe('Number of records'),
    },
    async ({ exchange, symbol, limit }) => {
      try {
        const ex = getExchange(exchange, 'swap');
        const history = await ex.fetchFundingRateHistory(
          symbol, undefined, limit
        );
        return { content: [{ type: 'text', text: JSON.stringify(history) }] };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_ohlcv',
    'Get OHLCV candlestick (K-line) data for a trading pair',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      timeframe: z
        .string()
        .optional()
        .default('1d')
        .describe('Timeframe: 1m, 5m, 15m, 1h, 4h, 1d, 1w'),
      limit: z
        .number()
        .optional()
        .default(100)
        .describe('Number of candles, max 1000'),
    },
    async ({ exchange, symbol, timeframe, limit }) => {
      try {
        const ex = getExchange(exchange);
        const data = await ex.fetchOHLCV(
          symbol,
          timeframe,
          undefined,
          Math.min(limit, 1000)
        );
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}