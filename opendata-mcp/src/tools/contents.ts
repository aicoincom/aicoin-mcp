/**
 * Content/news tools
 * Merged: get_newsflash + get_news_list + get_news_detail + get_rss_news_list → news (4→1)
 * Merged: get_flash_list + get_exchange_listing_flash → flash (merged into news as well... no)
 * Actually per plan: news = list + detail + rss (3→1), flash = newsflash + list + exchange_listing (3→1)
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet } from '../client/api.js';
import { ok, okList, err, maxItemsParam, parseMax } from './utils.js';

export function registerContentTools(server: McpServer) {
  // #17 news (3→1): get_news_list + get_news_detail + get_rss_news_list
  server.tool(
    'news',
    'News articles.\n• list — paginated news articles\n• detail — full article content. Requires: id\n• rss — RSS news feed',
    {
      action: z.enum(['list', 'detail', 'rss']).describe(
        'list: paginated news articles; detail: full article content; rss: RSS news feed'
      ),
      id: z.string().optional().describe('REQUIRED for detail. News article ID'),
      page: z.string().optional().describe('For list/rss: page number, default 1'),
      pageSize: z.string().optional().describe('For list/rss: page size, max 20'),
    },
    async ({ action, id, page, pageSize }) => {
      try {
        switch (action) {
          case 'list': {
            const params: Record<string, string> = {};
            if (page) params.page = page;
            params.pageSize = pageSize ?? '20';
            return ok(await apiGet('/api/v2/content/news-list', params));
          }
          case 'detail': {
            if (!id) return err('id is required for detail action');
            return ok(await apiGet('/api/v2/content/news-detail', { id }));
          }
          case 'rss': {
            const params: Record<string, string> = {};
            if (page) params.page = page;
            params.pageSize = pageSize ?? '20';
            return ok(await apiGet('/api/v2/content/square/market/news-list', params));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #18 flash (3→1): get_newsflash + get_flash_list + get_exchange_listing_flash
  server.tool(
    'flash',
    'Flash news.\n• newsflash — AiCoin flash news\n• list — industry flash with classification\n• exchange_listing — coin listing/delisting announcements',
    {
      action: z.enum(['newsflash', 'list', 'exchange_listing']).describe(
        'newsflash: AiCoin flash news; list: industry flash with types; exchange_listing: coin listing/delisting'
      ),
      language: z.string().optional().describe('Language: cn, tc, en'),
      createtime: z.string().optional().describe('For list: filter by create time'),
      memberIds: z.string().optional().describe(
        'For exchange_listing: exchange member IDs, comma-separated. 477=Binance, 1509=Bitget. Default: 477,1509'
      ),
      pageSize: z.string().optional().describe('For exchange_listing: page size, default 20'),
      ...maxItemsParam,
    },
    async ({ action, language, createtime, memberIds, pageSize, _max_items }) => {
      try {
        switch (action) {
          case 'newsflash': {
            const params: Record<string, string> = {};
            if (language) params.language = language;
            return ok(await apiGet('/api/v2/content/newsflash', params));
          }
          case 'list': {
            const params: Record<string, string> = {};
            if (language) params.language = language;
            if (createtime) params.createtime = createtime;
            return okList(
              await apiGet('/api/v2/content/flashList', params),
              parseMax(_max_items, 30)
            );
          }
          case 'exchange_listing': {
            const params: Record<string, string> = {};
            if (language) params.language = language;
            if (memberIds) params.memberIds = memberIds;
            if (pageSize) params.pageSize = pageSize;
            return ok(await apiGet('/api/v2/content/exchange-listing-flash', params));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
