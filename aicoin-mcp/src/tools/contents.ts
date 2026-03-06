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

  // #20 newsflash (3→1): search + list + detail (OpenData newsflash endpoints)
  server.tool(
    'newsflash',
    'Newsflash / breaking news from AiCoin OpenData.\n• search — search newsflash by keyword. Requires: word\n• list — newsflash list with filters (date, category, importance)\n• detail — single newsflash full content. Requires: flash_id',
    {
      action: z.enum(['search', 'list', 'detail']).describe(
        'search: search by keyword; list: newsflash list with filters; detail: full newsflash content'
      ),
      word: z.string().optional().describe('REQUIRED for search. Search keyword'),
      flash_id: z.string().optional().describe('REQUIRED for detail. Newsflash ID'),
      page: z.string().optional().describe('For search: page number, default 1'),
      size: z.string().optional().describe('For search: page size, default 20'),
      last_id: z.string().optional().describe('For list: cursor pagination, last item ID'),
      pagesize: z.string().optional().describe('For list: page size, default 20, max 50'),
      tab: z.string().optional().describe('For list: category tab (0-15)'),
      only_important: z.string().optional().describe('For list: 1=important only, 0=all'),
      lan: z.string().optional().describe('For list: language (cn, en)'),
      platform_show: z.string().optional().describe('For list: source filter (aicoin, twitter)'),
      date_mode: z.string().optional().describe('For list: date mode (normal, jump, range)'),
      jump_to_date: z.string().optional().describe('For list: jump to date YYYY-MM-DD (date_mode=jump)'),
      start_date: z.string().optional().describe('For list: start date YYYY-MM-DD (date_mode=range)'),
      end_date: z.string().optional().describe('For list: end date YYYY-MM-DD (date_mode=range)'),
      ...maxItemsParam,
    },
    async ({ action, word, flash_id, page, size, last_id, pagesize, tab, only_important, lan, platform_show, date_mode, jump_to_date, start_date, end_date, _max_items }) => {
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
          case 'list': {
            const params: Record<string, string> = {};
            if (last_id) params.last_id = last_id;
            if (pagesize) params.pagesize = pagesize;
            if (tab) params.tab = tab;
            if (only_important) params.only_important = only_important;
            if (lan) params.lan = lan;
            if (platform_show) params.platform_show = platform_show;
            if (date_mode) params.date_mode = date_mode;
            if (jump_to_date) params.jump_to_date = jump_to_date;
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;
            return okList(
              await apiGet('/api/upgrade/v2/content/newsflash/list', params),
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

  // #21 airdrop (8→1): list + exchanges + banner + finished + calendar + detail + cryptorank_list + cryptorank_detail
  server.tool(
    'airdrop',
    'Crypto airdrop data.\n• list — airdrop projects list with exchange/type filters\n• exchanges — available exchanges and activity types\n• banner — hot airdrop banners\n• finished — completed airdrop projects\n• calendar — airdrop calendar. Requires: year + month\n• detail — airdrop detail. Requires: detail_type (hodler/xlaunch) + token\n• cryptorank_list — CryptoRank airdrop list\n• cryptorank_detail — CryptoRank airdrop detail. Requires: token',
    {
      action: z.enum(['list', 'exchanges', 'banner', 'finished', 'calendar', 'detail', 'cryptorank_list', 'cryptorank_detail']).describe(
        'list: airdrop list; exchanges: exchange list; banner: hot banners; finished: completed; calendar: calendar; detail: project detail; cryptorank_list: CryptoRank list; cryptorank_detail: CryptoRank detail'
      ),
      detail_type: z.string().optional().describe('REQUIRED for detail. Type: hodler or xlaunch'),
      token: z.string().optional().describe('REQUIRED for detail/cryptorank_detail. Project token identifier'),
      year: z.string().optional().describe('REQUIRED for calendar. Year (2020-2030)'),
      month: z.string().optional().describe('REQUIRED for calendar. Month (1-12)'),
      page: z.string().optional().describe('For list/finished/cryptorank_list: page number, default 1'),
      page_size: z.string().optional().describe('For list/finished/cryptorank_list: page size, default 20'),
      exchange: z.string().optional().describe('For list/finished: exchange filter (binance, okx, bitget, bybit)'),
      activity_type: z.string().optional().describe('For list/finished: activity type (alpha, hodler, launchpool, xlaunch)'),
      status: z.string().optional().describe('For cryptorank_list: status filter'),
      limit: z.string().optional().describe('For banner: number of banners, default 5'),
      lan: z.string().optional().describe('Language: cn, en, tc'),
      ...maxItemsParam,
    },
    async ({ action, detail_type, token, year, month, page, page_size, exchange, activity_type, status, limit, lan, _max_items }) => {
      try {
        switch (action) {
          case 'list': {
            const params: Record<string, string> = {};
            if (page) params.page = page;
            if (page_size) params.page_size = page_size;
            if (exchange) params.exchange = exchange;
            if (activity_type) params.activity_type = activity_type;
            if (lan) params.lan = lan;
            return okList(
              await apiGet('/api/upgrade/v2/content/airdrop/list', params),
              parseMax(_max_items, 20)
            );
          }
          case 'exchanges': {
            const params: Record<string, string> = {};
            if (lan) params.lan = lan;
            return ok(await apiGet('/api/upgrade/v2/content/airdrop/exchanges', params));
          }
          case 'banner': {
            const params: Record<string, string> = {};
            if (limit) params.limit = limit;
            if (lan) params.lan = lan;
            return ok(await apiGet('/api/upgrade/v2/content/airdrop/banner', params));
          }
          case 'finished': {
            const params: Record<string, string> = {};
            if (page) params.page = page;
            if (page_size) params.page_size = page_size;
            if (exchange) params.exchange = exchange;
            if (activity_type) params.activity_type = activity_type;
            if (lan) params.lan = lan;
            return okList(
              await apiGet('/api/upgrade/v2/content/airdrop/finished', params),
              parseMax(_max_items, 20)
            );
          }
          case 'calendar': {
            if (!year) return err('year is required for calendar action');
            if (!month) return err('month is required for calendar action');
            const params: Record<string, string> = { year, month };
            if (lan) params.lan = lan;
            return ok(await apiGet('/api/upgrade/v2/content/airdrop/calendar', params));
          }
          case 'detail': {
            if (!detail_type) return err('detail_type is required for detail action (hodler or xlaunch)');
            if (!token) return err('token is required for detail action');
            const params: Record<string, string> = { detail_type, token };
            if (lan) params.lan = lan;
            return ok(await apiGet('/api/upgrade/v2/content/airdrop/detail', params));
          }
          case 'cryptorank_list': {
            const params: Record<string, string> = {};
            if (page) params.page = page;
            if (page_size) params.page_size = page_size;
            if (status) params.status = status;
            if (lan) params.lan = lan;
            return okList(
              await apiGet('/api/upgrade/v2/content/airdrop/cryptorank/list', params),
              parseMax(_max_items, 20)
            );
          }
          case 'cryptorank_detail': {
            if (!token) return err('token is required for cryptorank_detail action');
            const params: Record<string, string> = { token };
            if (lan) params.lan = lan;
            return ok(await apiGet('/api/upgrade/v2/content/airdrop/cryptorank/detail', params));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
