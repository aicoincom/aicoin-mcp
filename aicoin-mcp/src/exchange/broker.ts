/**
 * AiCoin Broker ID Configuration
 * Hardcoded for out-of-the-box rebate tracking
 */

export interface BrokerResult {
  options: Record<string, unknown>;
  headers: Record<string, string>;
}

const BROKER_CONFIG: Record<
  string,
  BrokerResult
> = {
  binance: {
    options: {
      broker: {
        spot: 'x-MGFCMH4U',
        margin: 'x-MGFCMH4U',
        future: 'x-FaeSBrMa',
        swap: 'x-FaeSBrMa',
        delivery: 'x-FaeSBrMa',
      },
    },
    headers: {},
  },
  binanceusdm: {
    options: {
      broker: { future: 'x-FaeSBrMa' },
    },
    headers: {},
  },
  binancecoinm: {
    options: {
      broker: { delivery: 'x-FaeSBrMa' },
    },
    headers: {},
  },
  okx: {
    options: { brokerId: 'c6851dd5f01e4aBC' },
    headers: {},
  },
  bybit: {
    options: { brokerId: 'AiCoin' },
    headers: {},
  },
  bitget: {
    options: { broker: 'tpequ' },
    headers: {},
  },
  gate: {
    options: {},
    headers: { 'X-Gate-Channel-Id': 'AiCoin1' },
  },
  huobi: {
    options: {
      broker: { id: 'AAf0e4f2ef' },
    },
    headers: {},
  },
  htx: {
    options: {
      broker: { id: 'AAf0e4f2ef' },
    },
    headers: {},
  },
  pionex: {
    options: { brokerId: 'AiCoin2023' },
    headers: {},
  },
  hyperliquid: {
    options: {
      broker: {
        address:
          '0xc7580C3eFaeae84865B7Cd1ee11d9f3069F36E82',
      },
    },
    headers: {},
  },
};

/**
 * Get broker options + headers for a specific exchange
 */
export function getBrokerOptions(
  exchangeId: string
): BrokerResult {
  const id = exchangeId.toLowerCase();
  return (
    BROKER_CONFIG[id] ?? { options: {}, headers: {} }
  );
}
