/**
 * Public market data tools - no API key required
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getExchange, SUPPORTED_EXCHANGES } from '../exchange/manager.js';
import { ok, err, okList } from './utils.js';

const marketTypeSchema = z
  .enum(['spot', 'future', 'swap'])
  .optional()
  .describe('Market type, default spot');

export function registerPublicTools(server: McpServer) {
  server.tool(
    'list_exchanges',
    'List all supported cryptocurrency exchanges',
    {},
    async () => ok(SUPPORTED_EXCHANGES)
  );

  server.tool(
    'get_ticker',
    'Get real-time ticker for a trading pair',
    {
      exchange: z.string().describe('Exchange ID, e.g. binance, okx, bybit'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type, { skipAuth: true });
        const ticker = await ex.fetchTicker(symbol);
        return ok(ticker);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_orderbook',
    'Get order book depth for a trading pair',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      limit: z.number().min(1).optional().default(20).describe('Depth limit'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type, { skipAuth: true });
        const book = await ex.fetchOrderBook(symbol, limit);
        return ok(book);
      } catch (e) {
        return err(e);
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
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type, { skipAuth: true });
        const trades = await ex.fetchTrades(symbol, undefined, limit);
        return ok(trades);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_markets',
    'Get available trading pairs on an exchange (filtered, paginated)',
    {
      exchange: z.string().describe('Exchange ID'),
      market_type: marketTypeSchema.describe('Filter by market type'),
      base: z.string().optional().describe('Filter by base currency, e.g. BTC'),
      quote: z.string().optional().describe('Filter by quote currency, e.g. USDT'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .default(100)
        .describe('Max results (1-500, default 100)'),
    },
    async ({ exchange, market_type, base, quote, limit }) => {
      try {
        const ex = getExchange(exchange, market_type, { skipAuth: true });
        await ex.loadMarkets();
        let markets = Object.values(ex.markets).map(m => ({
          symbol: m.symbol,
          base: m.base,
          quote: m.quote,
          type: m.type,
          active: m.active,
        }));
        if (market_type) markets = markets.filter(m => m.type === market_type);
        if (base) markets = markets.filter(m => m.base === base.toUpperCase());
        if (quote) markets = markets.filter(m => m.quote === quote.toUpperCase());
        return okList(markets.slice(0, limit), limit);
      } catch (e) {
        return err(e);
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
        .min(1)
        .describe('Trading pairs to query, e.g. ["BTC/USDT:USDT"]'),
    },
    async ({ exchange, symbols }) => {
      try {
        const ex = getExchange(exchange, 'swap', { skipAuth: true });
        const rates = await ex.fetchFundingRates(symbols);
        return ok(rates);
      } catch (e) {
        return err(e);
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
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbols, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type, { skipAuth: true });
        const syms = symbols && symbols.length > 0 ? symbols : undefined;
        const tickers = await ex.fetchTickers(syms);
        return okList(Object.values(tickers));
      } catch (e) {
        return err(e);
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
        const ex = getExchange(exchange, 'swap', { skipAuth: true });
        const history = await ex.fetchFundingRateHistory(
          symbol, undefined, limit
        );
        return ok(history);
      } catch (e) {
        return err(e);
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
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, timeframe, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type, { skipAuth: true });
        const data = await ex.fetchOHLCV(
          symbol,
          timeframe,
          undefined,
          Math.min(limit, 1000)
        );
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}