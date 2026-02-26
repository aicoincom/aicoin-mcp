/**
 * Content/news tools
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet } from '../client/api.js';

function ok(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  };
}

function err(e: unknown) {
  return {
    content: [
      { type: 'text' as const, text: `Error: ${(e as Error).message}` },
    ],
    isError: true as const,
  };
}

export function registerContentTools(server: McpServer) {
  server.tool(
    'get_newsflash',
    'Get latest crypto flash news (kuaixun)',
    {
      page: z
        .string()
        .optional()
        .describe('Page number, default 1'),
      limit: z
        .string()
        .optional()
        .describe('Items per page, default 20'),
    },
    async ({ page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params.page = page;
        if (limit) params.limit = limit;
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
        .describe('Page number'),
      limit: z
        .string()
        .optional()
        .describe('Items per page'),
    },
    async ({ page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params.page = page;
        if (limit) params.limit = limit;
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
        if (pageSize) params.pageSize = pageSize;
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
    },
    async ({ language, createtime }) => {
      try {
        const params: Record<string, string> = {};
        if (language) params.language = language;
        if (createtime) params.createtime = createtime;
        return ok(
          await apiGet(
            '/api/v2/content/flashList',
            params
          )
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
      page: z
        .string()
        .optional()
        .describe('Page number'),
      limit: z
        .string()
        .optional()
        .describe('Items per page'),
    },
    async ({ page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params.page = page;
        if (limit) params.limit = limit;
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