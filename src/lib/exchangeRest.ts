// Direct browser-to-exchange REST fetcher.
// Distributes load across user IPs instead of concentrating on the edge function's IP,
// which gets banned by Binance (HTTP 418) within seconds.
//
// All public endpoints (no auth needed) and all support CORS from the browser.

import type { ExchangeId, Timeframe } from "./exchangeSymbols";
import type { Ticker, OrderBook, Trade, Candle } from "@/hooks/useRealtimeMarket";

// ---------- helpers ----------

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return (await r.json()) as T;
}

function parseSymbol(symbol: string): { base: string; quote: string } {
  const [base, quoteWithTag] = symbol.split("/");
  const quote = (quoteWithTag ?? "").split(":")[0];
  if (!base || !quote) throw new Error(`Invalid symbol: ${symbol}`);
  return { base: base.toUpperCase(), quote: quote.toUpperCase() };
}

// Binance uses "BTCUSDT" (no slash). Coinbase uses "BTC-USD". Kraken has its own legacy aliases.
function joinForBinance(s: { base: string; quote: string }) { return `${s.base}${s.quote}`; }
function joinForCoinbase(s: { base: string; quote: string }) {
  // Coinbase historically used USD; many pairs not on USDT — auto-fall to USD if quote=USDT.
  const quote = s.quote === "USDT" ? "USD" : s.quote;
  return `${s.base}-${quote}`;
}
function joinForBybit(s: { base: string; quote: string }) { return `${s.base}${s.quote}`; }
function joinForOkx(s: { base: string; quote: string }) { return `${s.base}-${s.quote}`; }

// Kraken altnames differ for a few legacy assets.
const KRAKEN_BASE_ALIAS: Record<string, string> = {
  BTC: "XBT",
  DOGE: "XDG",
};
function joinForKraken(s: { base: string; quote: string }) {
  const base = KRAKEN_BASE_ALIAS[s.base] ?? s.base;
  const quote = s.quote === "USDT" ? "USD" : s.quote;
  return `${base}${quote}`;
}

// ---------- timeframe mapping ----------

const BINANCE_TF: Record<Timeframe, string> = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1d": "1d" };
const BYBIT_TF: Record<Timeframe, string> = { "1m": "1", "5m": "5", "15m": "15", "1h": "60", "4h": "240", "1d": "D" };
const OKX_TF: Record<Timeframe, string> = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1H", "4h": "4H", "1d": "1D" };
const COINBASE_TF_SECS: Record<Timeframe, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 21600, "1d": 86400 };
const KRAKEN_TF_MIN: Record<Timeframe, number> = { "1m": 1, "5m": 5, "15m": 15, "1h": 60, "4h": 240, "1d": 1440 };

// ============= TICKER =============

export async function fetchTickerDirect(exchange: ExchangeId, symbol: string): Promise<Ticker> {
  const s = parseSymbol(symbol);
  switch (exchange) {
    case "binance": {
      const r = await fetchJson<any>(`https://api.binance.com/api/v3/ticker/24hr?symbol=${joinForBinance(s)}`);
      const book = await fetchJson<any>(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${joinForBinance(s)}`);
      return {
        symbol,
        last: +r.lastPrice,
        bid: +book.bidPrice,
        ask: +book.askPrice,
        high: +r.highPrice,
        low: +r.lowPrice,
        open: +r.openPrice,
        baseVolume: +r.volume,
        quoteVolume: +r.quoteVolume,
        percentage: +r.priceChangePercent,
        change: +r.priceChange,
        timestamp: r.closeTime ?? Date.now(),
      };
    }
    case "coinbase": {
      const product = joinForCoinbase(s);
      const [t, stats] = await Promise.all([
        fetchJson<any>(`https://api.exchange.coinbase.com/products/${product}/ticker`),
        fetchJson<any>(`https://api.exchange.coinbase.com/products/${product}/stats`),
      ]);
      const last = +t.price;
      const open = +stats.open;
      return {
        symbol,
        last,
        bid: +t.bid,
        ask: +t.ask,
        high: +stats.high,
        low: +stats.low,
        open,
        baseVolume: +stats.volume,
        quoteVolume: +stats.volume * last,
        percentage: open ? ((last - open) / open) * 100 : 0,
        change: last - open,
        timestamp: new Date(t.time).getTime() || Date.now(),
      };
    }
    case "bybit": {
      const r = await fetchJson<any>(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${joinForBybit(s)}`);
      const item = r?.result?.list?.[0];
      if (!item) throw new Error("bybit ticker empty");
      return {
        symbol,
        last: +item.lastPrice,
        bid: +item.bid1Price,
        ask: +item.ask1Price,
        high: +item.highPrice24h,
        low: +item.lowPrice24h,
        open: +item.prevPrice24h,
        baseVolume: +item.volume24h,
        quoteVolume: +item.turnover24h,
        percentage: +item.price24hPcnt * 100,
        change: +item.lastPrice - +item.prevPrice24h,
        timestamp: Date.now(),
      };
    }
    case "okx": {
      const r = await fetchJson<any>(`https://www.okx.com/api/v5/market/ticker?instId=${joinForOkx(s)}`);
      const item = r?.data?.[0];
      if (!item) throw new Error("okx ticker empty");
      const last = +item.last;
      const open = +item.open24h;
      return {
        symbol,
        last,
        bid: +item.bidPx,
        ask: +item.askPx,
        high: +item.high24h,
        low: +item.low24h,
        open,
        baseVolume: +item.vol24h,
        quoteVolume: +item.volCcy24h,
        percentage: open ? ((last - open) / open) * 100 : 0,
        change: last - open,
        timestamp: +item.ts || Date.now(),
      };
    }
    case "kraken": {
      const pair = joinForKraken(s);
      const r = await fetchJson<any>(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
      const key = Object.keys(r?.result ?? {})[0];
      const item = key ? r.result[key] : null;
      if (!item) throw new Error("kraken ticker empty");
      const last = +item.c[0];
      const open = +item.o;
      return {
        symbol,
        last,
        bid: +item.b[0],
        ask: +item.a[0],
        high: +item.h[1],
        low: +item.l[1],
        open,
        baseVolume: +item.v[1],
        quoteVolume: +item.v[1] * last,
        percentage: open ? ((last - open) / open) * 100 : 0,
        change: last - open,
        timestamp: Date.now(),
      };
    }
  }
}

// ============= ORDER BOOK =============

export async function fetchOrderBookDirect(exchange: ExchangeId, symbol: string, limit = 20): Promise<OrderBook> {
  const s = parseSymbol(symbol);
  switch (exchange) {
    case "binance": {
      const r = await fetchJson<any>(`https://api.binance.com/api/v3/depth?symbol=${joinForBinance(s)}&limit=${Math.min(limit, 100)}`);
      return {
        symbol,
        bids: (r.bids ?? []).slice(0, limit).map((b: string[]) => ({ price: +b[0], amount: +b[1] })),
        asks: (r.asks ?? []).slice(0, limit).map((a: string[]) => ({ price: +a[0], amount: +a[1] })),
        timestamp: Date.now(),
      };
    }
    case "coinbase": {
      const r = await fetchJson<any>(`https://api.exchange.coinbase.com/products/${joinForCoinbase(s)}/book?level=2`);
      return {
        symbol,
        bids: (r.bids ?? []).slice(0, limit).map((b: any[]) => ({ price: +b[0], amount: +b[1] })),
        asks: (r.asks ?? []).slice(0, limit).map((a: any[]) => ({ price: +a[0], amount: +a[1] })),
        timestamp: Date.now(),
      };
    }
    case "bybit": {
      const r = await fetchJson<any>(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${joinForBybit(s)}&limit=${Math.min(limit, 50)}`);
      const ob = r?.result;
      return {
        symbol,
        bids: (ob?.b ?? []).slice(0, limit).map((b: string[]) => ({ price: +b[0], amount: +b[1] })),
        asks: (ob?.a ?? []).slice(0, limit).map((a: string[]) => ({ price: +a[0], amount: +a[1] })),
        timestamp: ob?.ts ?? Date.now(),
      };
    }
    case "okx": {
      const r = await fetchJson<any>(`https://www.okx.com/api/v5/market/books?instId=${joinForOkx(s)}&sz=${Math.min(limit, 50)}`);
      const ob = r?.data?.[0];
      return {
        symbol,
        bids: (ob?.bids ?? []).slice(0, limit).map((b: string[]) => ({ price: +b[0], amount: +b[1] })),
        asks: (ob?.asks ?? []).slice(0, limit).map((a: string[]) => ({ price: +a[0], amount: +a[1] })),
        timestamp: +ob?.ts || Date.now(),
      };
    }
    case "kraken": {
      const pair = joinForKraken(s);
      const r = await fetchJson<any>(`https://api.kraken.com/0/public/Depth?pair=${pair}&count=${limit}`);
      const key = Object.keys(r?.result ?? {})[0];
      const ob = key ? r.result[key] : null;
      return {
        symbol,
        bids: (ob?.bids ?? []).slice(0, limit).map((b: any[]) => ({ price: +b[0], amount: +b[1] })),
        asks: (ob?.asks ?? []).slice(0, limit).map((a: any[]) => ({ price: +a[0], amount: +a[1] })),
        timestamp: Date.now(),
      };
    }
  }
}

// ============= TRADES =============

export async function fetchTradesDirect(exchange: ExchangeId, symbol: string, limit = 50): Promise<Trade[]> {
  const s = parseSymbol(symbol);
  switch (exchange) {
    case "binance": {
      const r = await fetchJson<any[]>(`https://api.binance.com/api/v3/trades?symbol=${joinForBinance(s)}&limit=${Math.min(limit, 100)}`);
      return r.reverse().map((t) => ({
        id: String(t.id),
        timestamp: t.time,
        side: t.isBuyerMaker ? "sell" : "buy",
        price: +t.price,
        amount: +t.qty,
        cost: +t.price * +t.qty,
      }));
    }
    case "coinbase": {
      const r = await fetchJson<any[]>(`https://api.exchange.coinbase.com/products/${joinForCoinbase(s)}/trades?limit=${limit}`);
      return r.map((t) => ({
        id: String(t.trade_id),
        timestamp: new Date(t.time).getTime(),
        side: (t.side === "buy" ? "buy" : "sell"),
        price: +t.price,
        amount: +t.size,
        cost: +t.price * +t.size,
      }));
    }
    case "bybit": {
      const r = await fetchJson<any>(`https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=${joinForBybit(s)}&limit=${Math.min(limit, 60)}`);
      const list = r?.result?.list ?? [];
      return list.map((t: any) => ({
        id: String(t.execId),
        timestamp: +t.time,
        side: t.side?.toLowerCase() === "buy" ? "buy" : "sell",
        price: +t.price,
        amount: +t.size,
        cost: +t.price * +t.size,
      }));
    }
    case "okx": {
      const r = await fetchJson<any>(`https://www.okx.com/api/v5/market/trades?instId=${joinForOkx(s)}&limit=${Math.min(limit, 100)}`);
      return (r?.data ?? []).map((t: any) => ({
        id: String(t.tradeId),
        timestamp: +t.ts,
        side: t.side === "buy" ? "buy" : "sell",
        price: +t.px,
        amount: +t.sz,
        cost: +t.px * +t.sz,
      }));
    }
    case "kraken": {
      const pair = joinForKraken(s);
      const r = await fetchJson<any>(`https://api.kraken.com/0/public/Trades?pair=${pair}`);
      const key = Object.keys(r?.result ?? {}).find((k) => k !== "last");
      const list: any[] = key ? r.result[key] : [];
      return list
        .slice(-limit)
        .reverse()
        .map((t: any[], i: number) => ({
          id: `${t[2]}-${i}`,
          timestamp: Math.floor(t[2] * 1000),
          side: t[3] === "b" ? "buy" : "sell",
          price: +t[0],
          amount: +t[1],
          cost: +t[0] * +t[1],
        }));
    }
  }
}

// ============= OHLCV =============

export async function fetchOHLCVDirect(exchange: ExchangeId, symbol: string, timeframe: Timeframe, limit = 100): Promise<Candle[]> {
  const s = parseSymbol(symbol);
  switch (exchange) {
    case "binance": {
      const r = await fetchJson<any[]>(`https://api.binance.com/api/v3/klines?symbol=${joinForBinance(s)}&interval=${BINANCE_TF[timeframe]}&limit=${limit}`);
      return r.map((c) => ({ t: c[0], o: +c[1], h: +c[2], l: +c[3], c: +c[4], v: +c[5] }));
    }
    case "coinbase": {
      const r = await fetchJson<any[][]>(`https://api.exchange.coinbase.com/products/${joinForCoinbase(s)}/candles?granularity=${COINBASE_TF_SECS[timeframe]}`);
      return r
        .slice(0, limit)
        .reverse()
        .map((c) => ({ t: c[0] * 1000, l: +c[1], h: +c[2], o: +c[3], c: +c[4], v: +c[5] }));
    }
    case "bybit": {
      const r = await fetchJson<any>(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${joinForBybit(s)}&interval=${BYBIT_TF[timeframe]}&limit=${limit}`);
      const list = r?.result?.list ?? [];
      return list
        .slice()
        .reverse()
        .map((c: string[]) => ({ t: +c[0], o: +c[1], h: +c[2], l: +c[3], c: +c[4], v: +c[5] }));
    }
    case "okx": {
      const r = await fetchJson<any>(`https://www.okx.com/api/v5/market/candles?instId=${joinForOkx(s)}&bar=${OKX_TF[timeframe]}&limit=${limit}`);
      return (r?.data ?? [])
        .slice()
        .reverse()
        .map((c: string[]) => ({ t: +c[0], o: +c[1], h: +c[2], l: +c[3], c: +c[4], v: +c[5] }));
    }
    case "kraken": {
      const pair = joinForKraken(s);
      const r = await fetchJson<any>(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${KRAKEN_TF_MIN[timeframe]}`);
      const key = Object.keys(r?.result ?? {}).find((k) => k !== "last");
      const list: any[] = key ? r.result[key] : [];
      return list
        .slice(-limit)
        .map((c: any[]) => ({ t: c[0] * 1000, o: +c[1], h: +c[2], l: +c[3], c: +c[4], v: +c[6] }));
    }
  }
}
