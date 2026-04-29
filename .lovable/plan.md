# Fix Realtime Market Data Errors on /markets

## Root cause

The edge function logs show the real problem (not a generic timeout):

> `binance 418 I'm a teapot — Way too many requests; IP(...) banned until ...`

The Supabase edge function runs on a small pool of shared AWS IPs. Binance's public REST endpoints aggressively rate-limit and **ban the entire IP for ~1 hour** when traffic exceeds their weight budget. Because every user of this app proxies through the same few edge function IPs, Binance bans them within seconds — and CCXT's `fetchTicker` / `fetchOrderBook` first call `loadMarkets()` (a heavy `/exchangeInfo` request), which is what's actually getting banned.

Symptoms in the UI:
- "Ticker error: Edge Function returned a non-2xx status code"
- "Orderbook error: …"
- "Trades error: …"
- Intermittent — works briefly when the function cold-starts on a fresh IP, then fails again.

Coinbase, Kraken, Bybit, OKX are mostly fine; **Binance is the offender** but it's the default exchange and the default for `compare`/`funding`.

## Strategy

Three coordinated fixes:

1. **Bypass the edge function for the heavy public endpoints when possible.** Binance, Coinbase, Kraken, Bybit and OKX all support CORS on their public REST APIs, so the browser can call them directly — that distributes load across user IPs instead of concentrating on Supabase's IPs. The edge function stays as a fallback for symbol-format quirks and for `funding` / `compare`.
2. **Make the edge function resilient.** Skip `loadMarkets()` (use `fetchTicker`/`fetchOrderBook` with manual market hint), add per-exchange failover for ticker/orderbook/trades, return the last cached value on error instead of 5xx, and lengthen cache TTLs.
3. **Reduce client request volume.** Bump polling intervals, pause polling when tab is hidden, and stop showing red error cards on the very first failure (show stale data with a subtle "reconnecting" indicator instead).

## What changes

### 1. New browser-direct data layer — `src/lib/exchangeRest.ts`

A small fetcher that hits each exchange's public REST API directly from the browser:

- Binance: `https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT`, `/depth`, `/trades`, `/klines`
- Coinbase: `https://api.exchange.coinbase.com/products/BTC-USD/ticker` etc.
- Kraken: `https://api.kraken.com/0/public/Ticker?pair=XBTUSD` etc.
- Bybit: `https://api.bybit.com/v5/market/tickers`, `/orderbook`, `/recent-trade`, `/kline`
- OKX: `https://www.okx.com/api/v5/market/ticker` etc.

Normalises every response into the same `Ticker` / `OrderBook` / `Trade` / `Candle` shapes already defined in `useRealtimeMarket.ts`.

### 2. Hook update — `src/hooks/useRealtimeMarket.ts`

- Each hook (`useTicker`, `useOrderBook`, `useTrades`, `useOHLCV`) tries the **direct** REST call first; only falls back to the `market-data-ccxt` edge function if direct fetch throws (e.g. rare CORS issues or unknown symbol).
- Polling intervals raised to safer defaults: ticker 5s (from 3s), orderbook 4s (from 2s), trades 6s (from 3s), ohlcv 60s (from 30s).
- Add `document.visibilityState === 'hidden'` pause: hooks stop polling when the tab is in the background, resume on focus.
- Track a `consecutiveFailures` counter; only surface `error` to the UI after 3 consecutive failures, and keep returning the last good `data` in the meantime.
- `useArbitrage` and `useFunding` stay on the edge function (multi-exchange aggregation needs the server) but with longer intervals: arbitrage 20s (from 10s), funding 120s (from 60s).

### 3. Edge function hardening — `supabase/functions/market-data-ccxt/index.ts`

- **Drop Binance from the default `compare` set when it's currently banned**: track per-exchange "cooldown until" timestamps in memory; if Binance returned a 418/429 in the last 10 minutes, skip it for `compare` and route `funding` to Bybit/OKX first.
- **Stale-while-error**: on any handler failure, return the last cached value (even if expired) with `cached: true, stale: true` instead of a 500. UI keeps showing last good data.
- **Longer TTLs**: ticker 5s, orderbook 4s, trades 5s, ohlcv 60s, compare 15s, funding 120s.
- **Use `options.defaultType` and skip `loadMarkets`** where possible — for ticker/orderbook on known major pairs, set `markets` directly to avoid the heavy `/exchangeInfo` call that's triggering most bans.
- Add `Cache-Control: public, max-age=3` response header so any intermediate caches help too.

### 4. UI polish — `LiveTickerBar`, `OrderBookPanel`, `TradeTape`

- Replace the bright red error cards with a subtle inline "Reconnecting…" indicator next to the live dot when the hook is in a soft-error state (data still present from last poll).
- Only show the full-width destructive error card when there is **no data at all** AND we've failed 3+ times in a row.

## Files touched

```text
src/lib/exchangeRest.ts                                    (new)
src/hooks/useRealtimeMarket.ts                             (update)
src/components/markets/realtime/LiveTickerBar.tsx          (update)
src/components/markets/realtime/OrderBookPanel.tsx         (update)
src/components/markets/realtime/TradeTape.tsx              (update)
src/components/markets/realtime/CandlestickChart.tsx       (update)
supabase/functions/market-data-ccxt/index.ts               (update)
```

No DB changes, no new secrets, no new dependencies.

## Expected result

- The ticker, order book, trades and candles refresh smoothly even when Binance bans Supabase's IPs, because the browser fetches Binance directly from the user's own IP.
- The edge function becomes a thin fallback, rarely hit — eliminating the cascading 418 failures in logs.
- Errors only appear in the UI on genuine prolonged outages, not on transient single-request failures.
