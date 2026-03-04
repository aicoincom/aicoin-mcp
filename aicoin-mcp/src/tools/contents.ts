/**
 * Content/news tools
 * Merged: get_newsflash + get_news_list + get_news_detail + get_rss_news_list → news (4→1)
 * Merged: get_flash_list + get_exchange_listing_flash → flash (merged into news as well... no)
 * Actually per plan: news = list + detail + rss (3→1), flash = newsflash + list + exchange_listing (3→1)
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../client/api.js';
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

  // #19 twitter (4→1): latest + search + members + interaction_stats
  server.tool(
    'twitter',
    'Twitter/X crypto tweets.\n• latest — latest crypto tweets, cursor-paginated\n• search — search tweets by keyword. Requires: keyword\n• members — search Twitter KOL/users. Requires: word\n• interaction_stats — tweet engagement stats. Requires: flash_ids (POST)',
    {
      action: z.enum(['latest', 'search', 'members', 'interaction_stats']).describe(
        'latest: latest crypto tweets; search: search by keyword; members: search KOL/users; interaction_stats: tweet engagement'
      ),
      keyword: z.string().optional().describe('REQUIRED for search. Search keyword'),
      word: z.string().optional().describe('REQUIRED for members. User search keyword'),
      flash_ids: z.string().optional().describe(
        'REQUIRED for interaction_stats. Comma-separated tweet flash IDs, e.g. "123,456,789" (max 50)'
      ),
      language: z.string().optional().describe('For latest/search: language filter (cn, en)'),
      last_time: z.string().optional().describe('For latest/search: cursor for pagination (last item timestamp)'),
      page_size: z.string().optional().describe('For latest/search: page size, default 20'),
      page: z.string().optional().describe('For members: page number, default 1'),
      size: z.string().optional().describe('For members: page size, default 20'),
      ...maxItemsParam,
    },
    async ({ action, keyword, word, flash_ids, language, last_time, page_size, page, size, _max_items }) => {
      try {
        switch (action) {
          case 'latest': {
            const params: Record<string, string> = {};
            if (language) params.language = language;
            if (last_time) params.last_time = last_time;
            if (page_size) params.page_size = page_size;
            return okList(
              await apiGet('/api/upgrade/v2/content/twitter/latest', params),
              parseMax(_max_items, 20)
            );
          }
          case 'search': {
            if (!keyword) return err('keyword is required for search action');
            const params: Record<string, string> = { keyword };
            if (language) params.language = language;
            if (last_time) params.last_time = last_time;
            if (page_size) params.page_size = page_size;
            return okList(
              await apiGet('/api/upgrade/v2/content/twitter/search', params),
              parseMax(_max_items, 20)
            );
          }
          case 'members': {
            if (!word) return err('word is required for members action');
            const params: Record<string, string> = { word };
            if (page) params.page = page;
            if (size) params.size = size;
            return okList(
              await apiGet('/api/upgrade/v2/content/twitter/members', params),
              parseMax(_max_items, 20)
            );
          }
          case 'interaction_stats': {
            if (!flash_ids) return err('flash_ids is required for interaction_stats action');
            const ids = flash_ids.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
            if (ids.length === 0) return err('flash_ids must contain valid numeric IDs');
            if (ids.length > 50) return err('flash_ids max 50 items');
            return ok(await apiPost('/api/upgrade/v2/content/twitter/interaction-stats', { flash_ids: ids }));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #20 newsflash (2→1): search + detail (OpenData newsflash endpoints)
  server.tool(
    'newsflash',
    'Newsflash / breaking news from AiCoin OpenData.\n• search — search newsflash by keyword. Requires: word\n• detail — single newsflash full content. Requires: flash_id',
    {
      action: z.enum(['search', 'detail']).describe(
        'search: search by keyword; detail: full newsflash content'
      ),
      word: z.string().optional().describe('REQUIRED for search. Search keyword'),
      flash_id: z.string().optional().describe('REQUIRED for detail. Newsflash ID'),
      page: z.string().optional().describe('For search: page number, default 1'),
      size: z.string().optional().describe('For search: page size, default 20'),
      ...maxItemsParam,
    },
    async ({ action, word, flash_id, page, size, _max_items }) => {
      try {
        switch (action) {
          case 'search': {
            if (!word) return err('word is required for search action');
            const params: Record<string, string> = { word };
            if (page) params.page = page;
            if (size) params.size = size;
            return okList(
              await apiGet('/api/upgrade/v2/content/newsflash/search', params),
              parseMax(_max_items, 20)
            );
          }
          case 'detail': {
            if (!flash_id) return err('flash_id is required for detail action');
            return ok(await apiGet('/api/upgrade/v2/content/newsflash/detail', { flash_id }));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
