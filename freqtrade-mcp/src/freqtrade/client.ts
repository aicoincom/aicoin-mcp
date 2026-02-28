/**
 * Freqtrade REST API Client
 * Ported from ft_client/freqtrade_client/ft_rest_client.py
 * Uses HTTP Basic Auth for authentication.
 */
import type {
  FreqtradeConfig,
  PingResponse,
  ShowConfigResponse,
  BalanceResponse,
  CountResponse,
  TradeResponse,
  TradesResponse,
  ProfitResponse,
  PerformanceEntry,
  LogsResponse,
  SysinfoResponse,
  HealthResponse,
  VersionResponse,
  StrategyListResponse,
  StrategyResponse,
  WhitelistResponse,
  BlacklistResponse,
  LocksResponse,
  BacktestRequest,
  BacktestResponse,
  ForceEnterRequest,
  ForceExitRequest,
  AvailablePairsResponse,
  PairCandlesResponse,
  PairHistoryResponse,
  BacktestHistoryEntry,
  StatusResponse,
} from './types.js';

class FreqtradeClient {
  private serverUrl: string;
  private authHeader: string;
  private timeout: number;

  constructor(config: FreqtradeConfig) {
    this.serverUrl = config.serverUrl.replace(/\/$/, '');
    this.authHeader =
      'Basic ' +
      Buffer.from(`${config.username}:${config.password}`).toString('base64');
    this.timeout = config.timeout ?? 30_000;
  }

  private async call(
    method: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    data?: unknown
  ): Promise<unknown> {
    const url = new URL(`/api/v1/${path}`, this.serverUrl);

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: data !== undefined ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 401) {
          throw new Error(
            `Authentication failed (401). Check FREQTRADE_USERNAME and FREQTRADE_PASSWORD.`
          );
        }
        throw new Error(
          `Freqtrade API error ${res.status}: ${text || res.statusText}`
        );
      }

      return await res.json();
    } catch (e: unknown) {
      if (e instanceof TypeError && (e as { cause?: { code?: string } }).cause?.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to Freqtrade at ${this.serverUrl}. ` +
            `Make sure Freqtrade is running with api_server enabled.`
        );
      }
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new Error(
          `Request to Freqtrade timed out after ${this.timeout}ms. ` +
            `Check if Freqtrade is responsive at ${this.serverUrl}.`
        );
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  private get(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.call('GET', path, params);
  }

  private post(path: string, data?: unknown, params?: Record<string, string | number | boolean | undefined>) {
    return this.call('POST', path, params, data);
  }

  private del(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.call('DELETE', path, params);
  }

  // ─── Bot Control ───────────────────────────────────────────

  async ping(): Promise<PingResponse> {
    try {
      const config = (await this.showConfig()) as ShowConfigResponse;
      if (config?.state === 'running') {
        return { status: 'pong' };
      }
      return { status: 'not_running' };
    } catch {
      return { status: 'not_running' };
    }
  }

  async start(): Promise<StatusResponse> {
    return this.post('start') as Promise<StatusResponse>;
  }

  async stop(): Promise<StatusResponse> {
    return this.post('stop') as Promise<StatusResponse>;
  }

  async reloadConfig(): Promise<StatusResponse> {
    return this.post('reload_config') as Promise<StatusResponse>;
  }

  async showConfig(): Promise<ShowConfigResponse> {
    return this.get('show_config') as Promise<ShowConfigResponse>;
  }

  async version(): Promise<VersionResponse> {
    return this.get('version') as Promise<VersionResponse>;
  }

  async sysinfo(): Promise<SysinfoResponse> {
    return this.get('sysinfo') as Promise<SysinfoResponse>;
  }

  async health(): Promise<HealthResponse> {
    return this.get('health') as Promise<HealthResponse>;
  }

  async logs(limit?: number): Promise<LogsResponse> {
    return this.get('logs', limit ? { limit } : undefined) as Promise<LogsResponse>;
  }

  // ─── Trading ───────────────────────────────────────────────

  async balance(): Promise<BalanceResponse> {
    return this.get('balance') as Promise<BalanceResponse>;
  }

  async count(): Promise<CountResponse> {
    return this.get('count') as Promise<CountResponse>;
  }

  async status(): Promise<TradeResponse[]> {
    return this.get('status') as Promise<TradeResponse[]>;
  }

  async trade(tradeId: number): Promise<TradeResponse> {
    return this.get(`trade/${tradeId}`) as Promise<TradeResponse>;
  }

  async trades(limit?: number, offset?: number): Promise<TradesResponse> {
    const params: Record<string, number | undefined> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    return this.get('trades', params) as Promise<TradesResponse>;
  }

  async deleteTrade(tradeId: number): Promise<unknown> {
    return this.del(`trades/${tradeId}`);
  }

  async cancelOpenOrder(tradeId: number): Promise<unknown> {
    return this.del(`trades/${tradeId}/open-order`);
  }

  async forceenter(req: ForceEnterRequest): Promise<TradeResponse> {
    return this.post('forceenter', req) as Promise<TradeResponse>;
  }

  async forceexit(req: ForceExitRequest): Promise<unknown> {
    return this.post('forceexit', req);
  }

  // ─── Performance ───────────────────────────────────────────

  async profit(): Promise<ProfitResponse> {
    return this.get('profit') as Promise<ProfitResponse>;
  }

  async performance(): Promise<PerformanceEntry[]> {
    return this.get('performance') as Promise<PerformanceEntry[]>;
  }

  async daily(days?: number): Promise<unknown> {
    return this.get('daily', days ? { timescale: days } : undefined);
  }

  async weekly(weeks?: number): Promise<unknown> {
    return this.get('weekly', weeks ? { timescale: weeks } : undefined);
  }

  async monthly(months?: number): Promise<unknown> {
    return this.get('monthly', months ? { timescale: months } : undefined);
  }

  async stats(): Promise<unknown> {
    return this.get('stats');
  }

  async entries(pair?: string): Promise<unknown> {
    return this.get('entries', pair ? { pair } : undefined);
  }

  async exits(pair?: string): Promise<unknown> {
    return this.get('exits', pair ? { pair } : undefined);
  }

  // ─── Strategy ──────────────────────────────────────────────

  async strategies(): Promise<StrategyListResponse> {
    return this.get('strategies') as Promise<StrategyListResponse>;
  }

  async strategy(name: string): Promise<StrategyResponse> {
    return this.get(`strategy/${name}`) as Promise<StrategyResponse>;
  }

  // ─── Data ──────────────────────────────────────────────────

  async pairCandles(
    pair: string,
    timeframe: string,
    limit?: number
  ): Promise<PairCandlesResponse> {
    const params: Record<string, string | number | undefined> = {
      pair,
      timeframe,
    };
    if (limit) params.limit = limit;
    return this.get('pair_candles', params) as Promise<PairCandlesResponse>;
  }

  async pairHistory(
    pair: string,
    timeframe: string,
    strategy: string,
    timerange?: string
  ): Promise<PairHistoryResponse> {
    return this.get('pair_history', {
      pair,
      timeframe,
      strategy,
      timerange: timerange ?? '',
    }) as Promise<PairHistoryResponse>;
  }

  async availablePairs(
    timeframe?: string,
    stakeCurrency?: string
  ): Promise<AvailablePairsResponse> {
    return this.get('available_pairs', {
      timeframe: timeframe ?? '',
      stake_currency: stakeCurrency ?? '',
    }) as Promise<AvailablePairsResponse>;
  }

  async whitelist(): Promise<WhitelistResponse> {
    return this.get('whitelist') as Promise<WhitelistResponse>;
  }

  async blacklist(add?: string[]): Promise<BlacklistResponse> {
    if (!add || add.length === 0) {
      return this.get('blacklist') as Promise<BlacklistResponse>;
    }
    return this.post('blacklist', { blacklist: add }) as Promise<BlacklistResponse>;
  }

  async locks(): Promise<LocksResponse> {
    return this.get('locks') as Promise<LocksResponse>;
  }

  async lockAdd(
    pair: string,
    until: string,
    side: string = '*',
    reason: string = ''
  ): Promise<unknown> {
    return this.post('locks', [{ pair, until, side, reason }]);
  }

  async deleteLock(lockId: number): Promise<unknown> {
    return this.del(`locks/${lockId}`);
  }

  // ─── Backtesting ───────────────────────────────────────────

  async startBacktest(req: BacktestRequest): Promise<BacktestResponse> {
    return this.post('backtest', req) as Promise<BacktestResponse>;
  }

  async getBacktest(): Promise<BacktestResponse> {
    return this.get('backtest') as Promise<BacktestResponse>;
  }

  async abortBacktest(): Promise<unknown> {
    return this.del('backtest');
  }

  async deleteBacktest(): Promise<unknown> {
    return this.post('backtest/abort');
  }

  async backtestHistory(): Promise<BacktestHistoryEntry[]> {
    return this.get('backtest/history') as Promise<BacktestHistoryEntry[]>;
  }

  async backtestHistoryResult(
    filename: string,
    strategy: string
  ): Promise<unknown> {
    return this.get('backtest/history/result', { filename, strategy });
  }
}

// ─── Singleton ─────────────────────────────────────────────

let _client: FreqtradeClient | null = null;

export function getFreqtradeClient(): FreqtradeClient {
  if (!_client) {
    const serverUrl = process.env.FREQTRADE_URL || 'http://127.0.0.1:8080';
    const username = process.env.FREQTRADE_USERNAME || 'freqtrader';
    const password = process.env.FREQTRADE_PASSWORD || '';

    if (!password) {
      throw new Error(
        'FREQTRADE_PASSWORD is not set. ' +
          'Configure it in your environment or .env file.'
      );
    }

    _client = new FreqtradeClient({ serverUrl, username, password });
  }
  return _client;
}

export { FreqtradeClient };
