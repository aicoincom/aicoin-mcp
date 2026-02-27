/**
 * Content/news tools
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet } from '../client/api.js';
import { ok, okList, err, maxItemsParam, parseMax } from './utils.js';

export function registerContentTools(server: McpServer) {
  server.tool(
    'get_newsflash',
    'Get latest crypto flash news by AiCoin only',
    {
      language: z
        .string()
        .optional()
        .describe('Language: cn, tc, en'),
    },
    async ({ language }) => {
      try {
        const params: Record<string, string> = {};
        if (language) params.language = language;
        return ok(
          await apiGet('/api/v2/content/newsflash', params)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_news_list',
    'Get news article list',
    {
      page: z
        .string()
        .optional()
        .describe('Page number, default 1'),
      pageSize: z
        .string()
        .optional()
        .describe('Page size, max 20'),
    },
    async ({ page, pageSize }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params.page = page;
        params.pageSize = pageSize ?? '20';
        return ok(
          await apiGet('/api/v2/content/news-list', params)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_news_detail',
    'Get full content of a news article',
    {
      id: z.string().describe('News article ID'),
    },
    async ({ id }) => {
      try {
        return ok(
          await apiGet('/api/v2/content/news-detail', { id })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_rss_news_list',
    'Get RSS news list (dedicated RSS feed)',
    {
      page: z
        .string()
        .optional()
        .describe('Page number'),
      pageSize: z
        .string()
        .optional()
        .describe('Page size, max 20'),
    },
    async ({ page, pageSize }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params.page = page;
        params.pageSize = pageSize ?? '20';
        return ok(
          await apiGet(
            '/api/v2/content/square/market/news-list',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_flash_list',
    'Get industry flash news (with flash type classification)',
    {
      language: z
        .string()
        .optional()
        .describe('Language: cn, tc, en'),
      createtime: z
        .string()
        .optional()
        .describe('Filter by create time'),
      ...maxItemsParam,
    },
    async ({ language, createtime, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (language) params.language = language;
        if (createtime) params.createtime = createtime;
        return okList(
          await apiGet(
            '/api/v2/content/flashList',
            params
          ),
          parseMax(_max_items, 30)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_exchange_listing_flash',
    'Get exchange coin listing/delisting news',
    {
      language: z
        .string()
        .optional()
        .describe('Language: cn, tc, en'),
      memberIds: z
        .string()
        .optional()
        .describe(
          'Exchange member IDs, comma-separated. ' +
            '477=Binance, 1509=Bitget. Default: 477,1509'
        ),
      pageSize: z
        .string()
        .optional()
        .describe('Page size, default 20'),
    },
    async ({ language, memberIds, pageSize }) => {
      try {
        const params: Record<string, string> = {};
        if (language) params.language = language;
        if (memberIds) params.memberIds = memberIds;
        if (pageSize) params.pageSize = pageSize;
        return ok(
          await apiGet(
            '/api/v2/content/exchange-listing-flash',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );
}