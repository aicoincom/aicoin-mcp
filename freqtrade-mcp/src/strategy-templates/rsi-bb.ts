/**
 * RSI + Bollinger Bands strategy template
 */

export interface RsiBbTemplateParams {
  name: string;
  timeframe?: string;
  stoploss?: number;
  roi?: Record<string, number>;
}

export function generateRsiBbStrategy(params: RsiBbTemplateParams): string {
  const {
    name,
    timeframe = '1h',
    stoploss = -0.1,
    roi = { '0': 0.15, '30': 0.08, '60': 0.04, '120': 0.02 },
  } = params;

  const roiStr = Object.entries(roi)
    .map(([k, v]) => `        "${k}": ${v}`)
    .join(',\n');

  return `"""
${name} — RSI + Bollinger Bands strategy
Entries on RSI oversold + price touching lower Bollinger Band.
Exits on RSI overbought + price touching upper Bollinger Band.
"""
from freqtrade.strategy import IStrategy, IntParameter
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
    buy_rsi = IntParameter(15, 35, default=25, space="buy")
    sell_rsi = IntParameter(65, 85, default=75, space="sell")
    bb_period = IntParameter(15, 30, default=20, space="buy")
    bb_std = IntParameter(1, 3, default=2, space="buy")

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)

        bollinger = ta.BBANDS(
            dataframe, timeperiod=self.bb_period.value, nbdevup=self.bb_std.value, nbdevdn=self.bb_std.value
        )
        dataframe["bb_upper"] = bollinger["upperband"]
        dataframe["bb_middle"] = bollinger["middleband"]
        dataframe["bb_lower"] = bollinger["lowerband"]
        dataframe["bb_width"] = (dataframe["bb_upper"] - dataframe["bb_lower"]) / dataframe["bb_middle"]

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["rsi"] < self.buy_rsi.value)
                & (dataframe["close"] <= dataframe["bb_lower"])
                & (dataframe["volume"] > 0)
            ),
            "enter_long",
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["rsi"] > self.sell_rsi.value)
                & (dataframe["close"] >= dataframe["bb_upper"])
                & (dataframe["volume"] > 0)
            ),
            "exit_long",
        ] = 1
        return dataframe
`;
}
