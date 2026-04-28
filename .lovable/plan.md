
## Goal

Upgrade Markets from a single CoinGecko snapshot (60s polling, top 50 coins, no depth) to a **multi-exchange real-time market data layer** powered by **CCXT**, exposing:

- Live tickers across exchanges (Binance, Coinbase, Kraken, Bybit, OKX)
- Live **order book** (bids/asks depth)
- Live **recent trades** tape
- **OHLCV candlestick** chart (1m / 5m / 1h / 1d)
- **Funding rates** for perpetual futures
- **Cross-exchange price comparison** (arbitrage spotter)

## Why CCXT (not browser-direct)

CCXT is a Node/Python/PHP library — it cannot run in the browser due to CORS on exchange APIs. It must run server-side. We will run it inside a **Supabase Edge Function** (Deno) using the `npm:ccxt` import that Deno supports.

For true streaming (WebSockets) we will use **short-poll + edge function** (every 2–5s) rather than ccxt.pro (paid). This is realistic for retail UX and avoids paid tier.

## Architecture

```text
Browser (React)
   │  fetch every 2-5s (or on-demand)
   ▼
Edge Function: market-data-ccxt   ──►  Binance / Coinbase / Kraken / OKX / Bybit
   │  (uses npm:ccxt in Deno)
   ▼
Returns: ticker | orderbook | trades | ohlcv | funding | compare
```

Single edge function, multiple `action` modes — keeps cold-start cost low.

## What gets built

### 1. Edge function: `supabase/functions/market-data-ccxt/index.ts`
Accepts `{ action, exchange, symbol, timeframe?, limit? }`:
- `ticker` — last price, 24h vol, change, bid/ask
- `orderbook` — top 20 bids/asks
- `trades` — last 50 trades
- `ohlcv` — candles for chart
- `funding` — perp funding rate (Binance/Bybit/OKX)
- `compare` — same symbol across 5 exchanges → spread %

Public (no auth required, no credit cost — exchange APIs are free/public).
In-memory 2s cache per (action,exchange,symbol) to absorb burst polls.

### 2. New hook: `src/hooks/useRealtimeMarket.ts`
- `useTicker(exchange, symbol, intervalMs=3000)`
- `useOrderBook(exchange, symbol, intervalMs=2000)`
- `useTrades(exchange, symbol, intervalMs=3000)`
- `useOHLCV(exchange, symbol, timeframe)` — 30s refresh
- `useFunding(symbol)` — 60s refresh
- `useArbitrage(symbol)` — 10s refresh, cross-exchange spread

All use `setInterval` + cleanup, expose `{ data, isLoading, error, lastUpdated }`.

### 3. New components under `src/components/markets/realtime/`
- `ExchangeSelector.tsx` — pill switcher (Binance / Coinbase / Kraken / Bybit / OKX)
- `LiveTickerBar.tsx` — price, 24h%, bid/ask, vol, blinking on tick
- `OrderBookPanel.tsx` — bids (green) / asks (red) with depth bars + spread
- `TradeTape.tsx` — scrolling list of recent trades, color-coded buy/sell
- `CandlestickChart.tsx` — lightweight-charts (already candidate) or recharts candle approximation; 1m/5m/15m/1h/4h/1d toggles
- `FundingRateBadge.tsx` — current funding + countdown to next funding
- `ArbitrageStrip.tsx` — same coin, 5 exchanges, highlight best bid / best ask / max spread

### 4. Markets page integration (`src/pages/Markets.tsx`)
- New tab **"Realtime"** added to existing `Tabs` (Spot / Signals / Options / **Realtime**)
- Layout:
  ```text
  [ ExchangeSelector ]   [ Symbol search ]
  [ LiveTickerBar ]
  ┌────────────────────┬───────────────┐
  │  CandlestickChart  │  OrderBook    │
  │                    │               │
  ├────────────────────┤  TradeTape    │
  │  ArbitrageStrip    │               │
  │  FundingRateBadge  │               │
  └────────────────────┴───────────────┘
  ```
- Mobile: stacked, OrderBook + TradeTape collapsed inside `Sheet`/accordion.

### 5. Symbol mapping
Add `src/lib/exchangeSymbols.ts` mapping CoinGecko id → exchange symbol (e.g. `bitcoin` → `BTC/USDT`). Covers top 30 assets; rest fall back to `${SYMBOL}/USDT`.

## What stays the same
- `useMarketData` (CoinGecko) keeps powering the existing Spot table, Markets list, Watchlist, Portfolio valuations — it's the canonical "universe of coins". CCXT layer is additive, not a replacement.
- No DB schema changes (this is read-only public data).
- No credit cost — public exchange data is free.

## Technical details

**Edge function dependency**: `import ccxt from "npm:ccxt";` works in Deno (Supabase Edge runtime supports npm specifiers). Bundle is large (~3 MB) but cold start is acceptable for this pattern.

**Rate limits**: CCXT has a built-in `enableRateLimit: true`. We respect each exchange's limits. The 2s in-memory cache + per-symbol throttling keeps us well under free-tier limits.

**Error handling**: If one exchange fails (geo-blocked, downtime), `compare`/`arbitrage` skips it gracefully. Per-exchange failures shown as muted badge in `ArbitrageStrip`.

**Charts**: Use `recharts` (already in project) `ComposedChart` with custom candle renderer — avoids new heavy dep. If user later wants pro charts, swap to `lightweight-charts`.

**No WebSocket for v1**: Polling at 2–3s feels real-time and avoids the complexity of long-lived edge connections (Supabase functions are request/response). A future v2 could add a Supabase Realtime channel fed by a cron-driven edge function if needed.

## Files

**Created**
- `supabase/functions/market-data-ccxt/index.ts`
- `src/hooks/useRealtimeMarket.ts`
- `src/lib/exchangeSymbols.ts`
- `src/components/markets/realtime/ExchangeSelector.tsx`
- `src/components/markets/realtime/LiveTickerBar.tsx`
- `src/components/markets/realtime/OrderBookPanel.tsx`
- `src/components/markets/realtime/TradeTape.tsx`
- `src/components/markets/realtime/CandlestickChart.tsx`
- `src/components/markets/realtime/FundingRateBadge.tsx`
- `src/components/markets/realtime/ArbitrageStrip.tsx`
- `src/components/markets/realtime/RealtimePanel.tsx` (composition)

**Modified**
- `src/pages/Markets.tsx` — add "Realtime" tab
- `supabase/config.toml` — register new function (verify_jwt = false; public)

## Out of scope (ask if you want them)
- Placing real trades via CCXT (requires per-user API keys + secure key storage)
- ccxt.pro WebSocket streaming (paid)
- Derivatives orderbook beyond perp funding
