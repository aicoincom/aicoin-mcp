/**
 * AiCoin data-enhanced strategy template
 * Uses aicoin_provider.py for funding rate, open interest, and whale data
 */

export interface AiCoinTemplateParams {
  name: string;
  timeframe?: string;
  stoploss?: number;
  roi?: Record<string, number>;
}

export function generateAiCoinStrategy(params: AiCoinTemplateParams): string {
  const {
    name,
    timeframe = '1h',
    stoploss = -0.1,
    roi = { '0': 0.1, '60': 0.05, '180': 0.02 },
  } = params;

  const roiStr = Object.entries(roi)
    .map(([k, v]) => `        "${k}": ${v}`)
    .join(',\n');

  return `"""
${name} — AiCoin data-enhanced strategy
Combines traditional technical indicators with AiCoin on-chain/derivatives data:
- Funding rate (negative = potential long opportunity)
- Open interest changes (rising OI + rising price = strong trend)
- Whale order flow
"""
import logging
from freqtrade.strategy import IStrategy, DecimalParameter, IntParameter
import talib.abstract as ta
from pandas import DataFrame

logger = logging.getLogger(__name__)

# Import AiCoin data provider (deployed to user_data/strategies/)
try:
    from aicoin_provider import AiCoinProvider
    AICOIN_AVAILABLE = True
except ImportError:
    AICOIN_AVAILABLE = False
    logger.warning("aicoin_provider not found. Run ft_deploy_aicoin_provider to install it.")


class ${name}(IStrategy):
    INTERFACE_VERSION = 3

    timeframe = "${timeframe}"
    stoploss = ${stoploss}

    minimal_roi = {
${roiStr}
    }

    # Strategy parameters
    buy_rsi = IntParameter(20, 40, default=30, space="buy")
    sell_rsi = IntParameter(60, 80, default=70, space="sell")
    funding_rate_threshold = DecimalParameter(-0.001, 0.0, default=-0.0005, decimals=4, space="buy")

    def bot_start(self, **kwargs) -> None:
        """Initialize AiCoin provider on bot startup."""
        if AICOIN_AVAILABLE:
            try:
                self.aicoin = AiCoinProvider()
                logger.info("AiCoin provider initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to init AiCoin provider: {e}")
                self.aicoin = None
        else:
            self.aicoin = None

    def _get_aicoin_symbol(self, pair: str) -> str:
        """Convert Freqtrade pair (BTC/USDT) to AiCoin symbol (btcswapusdt:binance)."""
        base, quote = pair.split("/")
        return f"{base.lower()}swap{quote.lower()}:binance"

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        pair = metadata["pair"]

        # Traditional technical indicators
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        dataframe["sma_20"] = ta.SMA(dataframe, timeperiod=20)
        dataframe["ema_9"] = ta.EMA(dataframe, timeperiod=9)

        # AiCoin derivatives data
        if getattr(self, "aicoin", None) is not None:
            symbol = self._get_aicoin_symbol(pair)
            try:
                fr_df = self.aicoin.get_funding_rate(symbol, interval="8h", limit=10)
                if fr_df is not None and not fr_df.empty:
                    dataframe["funding_rate"] = fr_df["rate"].iloc[-1]
                else:
                    dataframe["funding_rate"] = 0.0
            except Exception as e:
                logger.debug(f"Funding rate fetch failed for {pair}: {e}")
                dataframe["funding_rate"] = 0.0

            try:
                oi_df = self.aicoin.get_open_interest(
                    pair.replace("/", "").upper(), interval="15m", limit=10
                )
                if oi_df is not None and not oi_df.empty:
                    dataframe["oi_change"] = oi_df["oi"].pct_change().iloc[-1]
                else:
                    dataframe["oi_change"] = 0.0
            except Exception as e:
                logger.debug(f"Open interest fetch failed for {pair}: {e}")
                dataframe["oi_change"] = 0.0
        else:
            dataframe["funding_rate"] = 0.0
            dataframe["oi_change"] = 0.0

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                # Technical: RSI oversold + price above SMA
                (dataframe["rsi"] < self.buy_rsi.value)
                & (dataframe["close"] > dataframe["sma_20"])
                # AiCoin: Negative funding rate (shorts paying longs)
                & (dataframe["funding_rate"] < self.funding_rate_threshold.value)
                & (dataframe["volume"] > 0)
            ),
            "enter_long",
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["rsi"] > self.sell_rsi.value)
                & (dataframe["volume"] > 0)
            ),
            "exit_long",
        ] = 1
        return dataframe
`;
}
