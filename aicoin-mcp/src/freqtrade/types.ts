/**
 * Freqtrade REST API type definitions
 */

export interface FreqtradeConfig {
  serverUrl: string;
  username: string;
  password: string;
  timeout?: number;
}

export interface PingResponse {
  status: 'pong' | 'not_running';
}

export interface StatusResponse {
  status: string;
}

export interface VersionResponse {
  version: string;
}

export interface ShowConfigResponse {
  version: string;
  strategy: string;
  strategy_version?: string;
  state: string;
  trading_mode: string;
  runmode: string;
  timeframe: string;
  exchange: string;
  stake_currency: string;
  stake_amount: string | number;
  max_open_trades: number;
  dry_run: boolean;
  [key: string]: unknown;
}

export interface BalanceResponse {
  currencies: Array<{
    currency: string;
    free: number;
    balance: number;
    used: number;
    est_stake: number;
    [key: string]: unknown;
  }>;
  total: number;
  symbol: string;
  value: number;
  note: string;
  [key: string]: unknown;
}

export interface CountResponse {
  current: number;
  max: number;
  total_stake: number;
}

export interface TradeResponse {
  trade_id: number;
  pair: string;
  is_open: boolean;
  amount: number;
  stake_amount: number;
  open_rate: number;
  close_rate?: number;
  profit_ratio?: number;
  profit_abs?: number;
  open_date: string;
  close_date?: string;
  enter_tag?: string;
  exit_reason?: string;
  [key: string]: unknown;
}

export interface TradesResponse {
  trades: TradeResponse[];
  trades_count: number;
  offset: number;
  total_trades: number;
}

export interface ProfitResponse {
  profit_closed_coin: number;
  profit_closed_percent_mean: number;
  profit_closed_ratio_mean: number;
  profit_closed_percent_sum: number;
  profit_closed_percent: number;
  profit_closed_fiat: number;
  profit_all_coin: number;
  profit_all_percent_mean: number;
  profit_all_percent_sum: number;
  profit_all_percent: number;
  profit_all_fiat: number;
  trade_count: number;
  closed_trade_count: number;
  first_trade_date: string;
  latest_trade_date: string;
  [key: string]: unknown;
}

export interface DailyRecord {
  date: string;
  abs_profit: number;
  rel_profit: number;
  starting_balance: number;
  fiat_value: number;
  trade_count: number;
}

export interface PerformanceEntry {
  pair: string;
  profit: number;
  profit_abs: number;
  count: number;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface LogsResponse {
  log_count: number;
  logs: LogEntry[];
}

export interface SysinfoResponse {
  cpu_pct: number[];
  ram_pct: number;
}

export interface HealthResponse {
  last_process: string;
  last_process_ts: number;
  [key: string]: unknown;
}

export interface StrategyListResponse {
  strategies: string[];
}

export interface StrategyResponse {
  strategy: string;
  code: string;
  [key: string]: unknown;
}

export interface WhitelistResponse {
  whitelist: string[];
  length: number;
  method: string[];
}

export interface BlacklistResponse {
  blacklist: string[];
  blacklist_log?: string[];
  length: number;
  method: string[];
  errors?: Record<string, string>;
}

export interface LockResponse {
  id: number;
  pair: string;
  until: string;
  side: string;
  reason: string;
  active: boolean;
  lock_end_timestamp: number;
  lock_time: string;
}

export interface LocksResponse {
  lock_count: number;
  locks: LockResponse[];
}

export interface BacktestRequest {
  strategy: string;
  timerange?: string;
  timeframe?: string;
  max_open_trades?: number;
  stake_amount?: number | string;
  enable_protections?: boolean;
  dry_run_wallet?: number;
  [key: string]: unknown;
}

export interface BacktestResponse {
  status: string;
  running: boolean;
  status_msg: string;
  step: string;
  progress: number;
  trade_count?: number;
  [key: string]: unknown;
}

export interface ForceEnterRequest {
  pair: string;
  side: 'long' | 'short';
  price?: number;
  ordertype?: string;
  stakeamount?: number;
  leverage?: number;
  entry_tag?: string;
}

export interface ForceExitRequest {
  tradeid: number | string;
  ordertype?: string;
  amount?: number;
}

export interface AvailablePairsResponse {
  pairs: string[];
  pair_interval: Array<{ pair: string; timeframe: string }>;
  length: number;
}

export interface PairCandlesResponse {
  pair: string;
  timeframe: string;
  data: unknown[];
  length: number;
  columns: string[];
  [key: string]: unknown;
}

export interface PairHistoryResponse {
  pair: string;
  timeframe: string;
  strategy: string;
  data: unknown[];
  length: number;
  columns: string[];
  [key: string]: unknown;
}

export interface BacktestHistoryEntry {
  filename: string;
  strategy: string;
  run_id: string;
  notes?: string;
  [key: string]: unknown;
}
