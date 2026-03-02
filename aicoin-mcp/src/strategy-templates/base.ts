/**
 * Basic strategy template — RSI + MA crossover
 */

export interface BasicTemplateParams {
  name: string;
  timeframe?: string;
  stoploss?: number;
  roi?: Record<string, number>;
}

export function generateBasicStrategy(params: BasicTemplateParams): string {
  const {
    name,
    timeframe = '1h',
    stoploss = -0.1,
    roi = { '0': 0.1, '40': 0.05, '120': 0.02 },
  } = params;

  const roiStr = Object.entries(roi)
    .map(([k, v]) => `        "${k}": ${v}`)
    .join(',\n');

  return `"""
${name} — Auto-generated basic strategy (RSI + MA)
"""
from freqtrade.strategy import IStrategy, DecimalParameter, IntParameter
import talib.abstract as ta
from pandas import DataFrame


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
    ma_period = IntParameter(10, 50, default=20, space="buy")

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        dataframe["sma"] = ta.SMA(dataframe, timeperiod=self.ma_period.value)
        dataframe["ema"] = ta.EMA(dataframe, timeperiod=self.ma_period.value)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["rsi"] < self.buy_rsi.value)
                & (dataframe["close"] > dataframe["sma"])
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
