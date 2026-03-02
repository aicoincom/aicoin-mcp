"""
AiCoin Data Provider for Freqtrade Strategies

Standalone Python module — no Freqtrade dependency.
Deploy to user_data/strategies/ and import in your strategy:

    from aicoin_provider import AiCoinProvider

    class MyStrategy(IStrategy):
        def bot_start(self, **kwargs):
            self.aicoin = AiCoinProvider()

        def populate_indicators(self, dataframe, metadata):
            fr = self.aicoin.get_funding_rate('btcswapusdt:binance')
            ...

Environment variables:
    AICOIN_API_KEY      - AiCoin OpenAPI access key
    AICOIN_API_SECRET   - AiCoin OpenAPI secret key
    AICOIN_PROXY        - HTTP proxy (optional), e.g. http://127.0.0.1:7890
"""

import hashlib
import hmac
import json
import logging
import os
import time
import urllib.request
import urllib.parse
import urllib.error
from base64 import b64encode
from binascii import hexlify

logger = logging.getLogger(__name__)

# Optional pandas import — returns dicts if pandas not available
try:
    import pandas as pd

    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


class _Cache:
    """Simple in-memory TTL cache."""

    def __init__(self, ttl: int = 60):
        self.ttl = ttl
        self._store: dict = {}

    def get(self, key: str):
        if key in self._store:
            val, ts = self._store[key]
            if time.time() - ts < self.ttl:
                return val
            del self._store[key]
        return None

    def set(self, key: str, value):
        self._store[key] = (value, time.time())


class AiCoinProvider:
    """AiCoin data provider — fetches derivatives and on-chain data via AiCoin OpenAPI."""

    BASE_URL = "https://openapi.aicoin.com"

    def __init__(
        self,
        api_key: str | None = None,
        api_secret: str | None = None,
        proxy: str | None = None,
        cache_ttl: int = 60,
    ):
        self.api_key = api_key or os.environ.get("AICOIN_API_KEY", "")
        self.api_secret = api_secret or os.environ.get("AICOIN_API_SECRET", "")
        self.proxy = proxy or os.environ.get("AICOIN_PROXY")
        self._cache = _Cache(ttl=cache_ttl)

        if not self.api_key or not self.api_secret:
            raise ValueError(
                "AiCoin API credentials required. "
                "Set AICOIN_API_KEY and AICOIN_API_SECRET environment variables."
            )

        # Set up urllib opener with optional proxy
        handlers = []
        if self.proxy:
            proxy_handler = urllib.request.ProxyHandler(
                {"http": self.proxy, "https": self.proxy}
            )
            handlers.append(proxy_handler)
        self._opener = urllib.request.build_opener(*handlers)

    def _sign(self) -> dict:
        """Generate AiCoin API signature (HMAC-SHA1 + hex + Base64)."""
        nonce = hexlify(os.urandom(4)).decode()
        ts = str(int(time.time()))

        sign_str = (
            f"AccessKeyId={self.api_key}"
            f"&SignatureNonce={nonce}"
            f"&Timestamp={ts}"
        )

        hex_digest = hmac.new(
            self.api_secret.encode("utf-8"),
            sign_str.encode("utf-8"),
            hashlib.sha1,
        ).hexdigest()

        signature = b64encode(hex_digest.encode("latin-1")).decode()

        return {
            "AccessKeyId": self.api_key,
            "SignatureNonce": nonce,
            "Timestamp": ts,
            "Signature": signature,
        }

    def _request(self, path: str, params: dict | None = None) -> dict | list | None:
        """Make authenticated GET request to AiCoin API."""
        cache_key = f"{path}:{json.dumps(params or {}, sort_keys=True)}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        auth = self._sign()
        all_params = {**(params or {}), **auth}
        query = urllib.parse.urlencode(all_params)
        url = f"{self.BASE_URL}{path}?{query}"

        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "AiCoinProvider/1.0",
            },
        )

        try:
            with self._opener.open(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if isinstance(data, dict) and data.get("code") not in (None, 0, 200, "200"):
                    logger.warning(f"AiCoin API error: {data}")
                    return None
                result = data.get("data", data) if isinstance(data, dict) else data
                self._cache.set(cache_key, result)
                return result
        except urllib.error.HTTPError as e:
            logger.warning(f"AiCoin HTTP error {e.code}: {e.reason} for {path}")
            return None
        except Exception as e:
            logger.warning(f"AiCoin request failed for {path}: {e}")
            return None

    @staticmethod
    def _to_dataframe(data, columns=None):
        """Convert list data to DataFrame if pandas available."""
        if not HAS_PANDAS or data is None:
            return data
        if isinstance(data, list):
            return pd.DataFrame(data, columns=columns)
        if isinstance(data, dict) and "data" in data:
            return pd.DataFrame(data["data"])
        return data

    # ─── Funding Rate ─────────────────────────────────────────

    def get_funding_rate(self, symbol: str, interval: str = "8h", limit: int = 100):
        """
        Get funding rate history.

        Args:
            symbol: Trading pair, e.g. 'btcswapusdt:okcoinfutures'
            interval: 5m, 15m, 30m, 8h (recommended)
            limit: Number of records (default 100)

        Returns:
            DataFrame with columns [time, rate] or raw list
        """
        data = self._request(
            "/api/v2/fundingRateHistory",
            {"symbol": symbol, "interval": interval, "limit": str(limit)},
        )
        return self._to_dataframe(data)

    # ─── Open Interest ────────────────────────────────────────

    def get_open_interest(self, symbol: str, interval: str = "15m", limit: int = 100):
        """
        Get aggregated stablecoin-margined open interest history.

        Args:
            symbol: Coin symbol, e.g. 'BTC'
            interval: 1m, 2m, 15m, 30m
            limit: Number of records

        Returns:
            DataFrame with columns [time, oi] or raw list
        """
        data = self._request(
            "/api/v2/aggoistablecoinhistory",
            {"symbol": symbol, "interval": interval, "limit": str(limit)},
        )
        return self._to_dataframe(data)

    # ─── Liquidation ──────────────────────────────────────────

    def get_liquidation(self, symbol: str, interval: str = "15m", limit: int = 100):
        """
        Get liquidation order history.

        Args:
            symbol: Trading pair, e.g. 'btcswapusdt:binance'
            interval: 1m, 2m, 15m, 30m
            limit: Number of records

        Returns:
            DataFrame or raw list
        """
        data = self._request(
            "/api/v2/liquidationHistory",
            {"symbol": symbol, "interval": interval, "limit": str(limit)},
        )
        return self._to_dataframe(data)

    # ─── Whale Orders ─────────────────────────────────────────

    def get_whale_orders(self, symbol: str):
        """
        Get whale/large order tracking data.

        Args:
            symbol: Trading pair, e.g. 'btcusdt:okex'

        Returns:
            DataFrame or raw list
        """
        data = self._request("/api/v2/bigOrders", {"symbol": symbol})
        return self._to_dataframe(data)

    # ─── Long/Short Ratio ─────────────────────────────────────

    def get_long_short_ratio(self) -> dict | None:
        """
        Get long/short ratio data.

        Returns:
            dict with ratio data
        """
        return self._request("/api/v2/lsRatio")

    # ─── Indicator K-line ─────────────────────────────────────

    def get_indicator_kline(
        self,
        symbol: str,
        indicator_key: str,
        period: str = "3600",
        size: int = 100,
    ):
        """
        Get indicator K-line data (fund flow, aggregated trades, etc.)

        Args:
            symbol: Trading pair, e.g. 'btcswapusdt:binance'
            indicator_key: fundflow, aiaggtrade, fr, etc.
            period: Period in seconds: 900=15min, 3600=1h, 14400=4h, 86400=1d
            size: Number of records (1-500)

        Returns:
            DataFrame or raw list
        """
        data = self._request(
            "/api/v2/indicatorklinedata",
            {
                "symbol": symbol,
                "indicator_key": indicator_key,
                "period": period,
                "size": str(size),
            },
        )
        return self._to_dataframe(data)

    # ─── K-line ───────────────────────────────────────────────

    def get_kline(self, symbol: str, period: str = "86400", size: int = 100):
        """
        Get K-line (candlestick) data.

        Args:
            symbol: e.g. 'btcusdt:okex' or 'i:ixic:nasdaq'
            period: Period in seconds: 900=15min, 3600=1h, 14400=4h, 86400=1d
            size: Number of candles (1-500)

        Returns:
            DataFrame or raw list
        """
        data = self._request(
            "/api/v2/klinedata",
            {"symbol": symbol, "period": period, "size": str(size)},
        )
        return self._to_dataframe(data)

    # ─── Newsflash ────────────────────────────────────────────

    def get_newsflash(self, language: str = "cn") -> list | None:
        """
        Get latest crypto flash news.

        Args:
            language: cn, tc, en

        Returns:
            list of news items
        """
        return self._request("/api/v2/newsflash", {"language": language})
