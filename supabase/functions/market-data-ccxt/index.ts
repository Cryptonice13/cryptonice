// Edge function: market-data-ccxt
// Real-time multi-exchange market data via CCXT (REST polling).
// Public endpoint, no auth required, no credit cost.
//
// This function is now a FALLBACK for the browser-direct fetcher in src/lib/exchangeRest.ts.
// Hardened to be resilient against Binance IP bans (HTTP 418) which are the dominant
// failure mode when many users share Supabase's edge function IP pool.

// @ts-ignore - npm specifier is resolved by Deno at runtime
import ccxt from "npm:ccxt@4.4.34";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Action = "ticker" | "orderbook" | "trades" | "ohlcv" | "funding" | "compare" | "exchanges";

const SUPPORTED_EXCHANGES = ["binance", "coinbase", "kraken", "bybit", "okx"] as const;
type SupportedExchange = typeof SUPPORTED_EXCHANGES[number];

// ---------- exchange client cache ----------
const exchangeCache = new Map<string, any>();
function getExchange(id: SupportedExchange) {
  if (exchangeCache.has(id)) return exchangeCache.get(id);
  // @ts-ignore - dynamic indexing of ccxt namespace
  const ExClass = (ccxt as any)[id];
  if (!ExClass) throw new Error(`Unsupported exchange: ${id}`);
  const ex = new ExClass({ enableRateLimit: true, timeout: 8000 });
  exchangeCache.set(id, ex);
  return ex;
}

// ---------- response cache ----------
const respCache = new Map<string, { ts: number; data: unknown }>();
const CACHE_MS: Record<Action, number> = {
  ticker: 5000,
  orderbook: 4000,
  trades: 5000,
  ohlcv: 60000,
  funding: 120000,
  compare: 15000,
  exchanges: 60000,
};

function cacheGet(key: string, ttl: number) {
  const hit = respCache.get(key);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;
  return null;
}
// Stale-while-error: returns last known value regardless of age
function cacheGetStale(key: string) {
  return respCache.get(key)?.data ?? null;
}
function cacheSet(key: string, data: unknown) {
  respCache.set(key, { ts: Date.now(), data });
  if (respCache.size > 500) {
    const oldest = [...respCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) respCache.delete(oldest[0]);
  }
}

// ---------- per-exchange cooldown after rate-limit / ban ----------
const cooldownUntil = new Map<SupportedExchange, number>();
function isOnCooldown(id: SupportedExchange) {
  const t = cooldownUntil.get(id);
  return t != null && Date.now() < t;
}
function markCooldown(id: SupportedExchange, ms: number) {
  cooldownUntil.set(id, Date.now() + ms);
}
function isRateLimitError(e: any): boolean {
  const msg = String(e?.message ?? e ?? "");
  return /418|429|too many requests|DDoSProtection|RateLimitExceeded/i.test(msg);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3",
    },
  });
}

// ---------- handlers ----------

async function handleTicker(exchange: SupportedExchange, symbol: string) {
  const ex = getExchange(exchange);
  const t = await ex.fetchTicker(symbol);
  return {
    symbol: t.symbol,
    last: t.last,
    bid: t.bid,
    ask: t.ask,
    high: t.high,
    low: t.low,
    open: t.open,
    close: t.close,
    baseVolume: t.baseVolume,
    quoteVolume: t.quoteVolume,
    percentage: t.percentage,
    change: t.change,
    timestamp: t.timestamp,
  };
}

async function handleOrderBook(exchange: SupportedExchange, symbol: string, limit = 20) {
  const ex = getExchange(exchange);
  const ob = await ex.fetchOrderBook(symbol, limit);
  return {
    symbol,
    bids: (ob.bids || []).slice(0, limit).map((b: number[]) => ({ price: b[0], amount: b[1] })),
    asks: (ob.asks || []).slice(0, limit).map((a: number[]) => ({ price: a[0], amount: a[1] })),
    timestamp: ob.timestamp ?? Date.now(),
  };
}

async function handleTrades(exchange: SupportedExchange, symbol: string, limit = 50) {
  const ex = getExchange(exchange);
  const trades = await ex.fetchTrades(symbol, undefined, limit);
  return trades.slice(-limit).reverse().map((t: any) => ({
    id: t.id,
    timestamp: t.timestamp,
    side: t.side,
    price: t.price,
    amount: t.amount,
    cost: t.cost,
  }));
}

async function handleOHLCV(
  exchange: SupportedExchange,
  symbol: string,
  timeframe = "1h",
  limit = 100,
) {
  const ex = getExchange(exchange);
  if (!ex.has?.fetchOHLCV) throw new Error(`${exchange} does not support OHLCV`);
  const candles = await ex.fetchOHLCV(symbol, timeframe, undefined, limit);
  return candles.map((c: number[]) => ({
    t: c[0], o: c[1], h: c[2], l: c[3], c: c[4], v: c[5],
  }));
}

// Funding: try non-Binance first since Binance is most likely to be banned.
async function handleFunding(symbol: string) {
  const perpSymbol = symbol.includes(":") ? symbol : `${symbol}:${symbol.split("/")[1] ?? "USDT"}`;
  const ordered: SupportedExchange[] = ["bybit", "okx", "binance"];
  const tries = ordered.filter((id) => !isOnCooldown(id));
  const final = tries.length ? tries : ordered; // if all are cooled down, just try anyway
  let lastErr: any;
  for (const id of final) {
    try {
      const ex = getExchange(id);
      if (!ex.has?.fetchFundingRate) continue;
      const fr = await ex.fetchFundingRate(perpSymbol);
      return {
        exchange: id,
        symbol: fr.symbol,
        fundingRate: fr.fundingRate,
        nextFundingTimestamp: fr.nextFundingTimestamp ?? fr.fundingTimestamp,
        markPrice: fr.markPrice,
        indexPrice: fr.indexPrice,
      };
    } catch (e) {
      lastErr = e;
      if (isRateLimitError(e)) markCooldown(id, 10 * 60 * 1000);
    }
  }
  throw new Error("No exchange returned funding rate for " + symbol + (lastErr ? `: ${(lastErr as Error).message}` : ""));
}

async function handleCompare(symbol: string) {
  // Skip exchanges currently on cooldown.
  const candidates = SUPPORTED_EXCHANGES.filter((id) => !isOnCooldown(id));
  const used = candidates.length >= 2 ? candidates : [...SUPPORTED_EXCHANGES];
  const results = await Promise.all(
    used.map(async (id) => {
      try {
        const ex = getExchange(id);
        const t = await ex.fetchTicker(symbol);
        return {
          exchange: id,
          last: t.last, bid: t.bid, ask: t.ask,
          baseVolume: t.baseVolume, quoteVolume: t.quoteVolume,
          percentage: t.percentage,
          ok: true,
        };
      } catch (e) {
        if (isRateLimitError(e)) markCooldown(id, 10 * 60 * 1000);
        return { exchange: id, ok: false, error: (e as Error).message?.slice(0, 120) ?? "unknown" };
      }
    }),
  );
  const valid = results.filter((r) => r.ok && typeof (r as any).last === "number");
  let bestBid: any = null, bestAsk: any = null, spreadPct = 0;
  if (valid.length >= 2) {
    bestBid = valid.reduce((a: any, b: any) => ((a.bid ?? 0) > (b.bid ?? 0) ? a : b));
    bestAsk = valid.reduce((a: any, b: any) => ((a.ask ?? Infinity) < (b.ask ?? Infinity) ? a : b));
    if (bestBid?.bid && bestAsk?.ask) {
      spreadPct = ((bestBid.bid - bestAsk.ask) / bestAsk.ask) * 100;
    }
  }
  return { symbol, results, bestBidExchange: bestBid?.exchange, bestAskExchange: bestAsk?.exchange, spreadPct };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let cacheKey = "";
  try {
    const body = req.method === "POST" ? await req.json() : Object.fromEntries(new URL(req.url).searchParams);
    const action = (body.action ?? "ticker") as Action;
    const exchange = (body.exchange ?? "binance") as SupportedExchange;
    const symbol = (body.symbol ?? "BTC/USDT") as string;
    const timeframe = (body.timeframe ?? "1h") as string;
    const limit = body.limit ? Number(body.limit) : undefined;

    if (action !== "exchanges" && action !== "funding" && action !== "compare") {
      if (!SUPPORTED_EXCHANGES.includes(exchange)) {
        return jsonResponse({ error: `exchange must be one of ${SUPPORTED_EXCHANGES.join(",")}` }, 400);
      }
    }
    if (action !== "exchanges" && !/^[A-Z0-9]{2,10}\/[A-Z0-9]{2,10}(:[A-Z0-9]{2,10})?$/.test(symbol)) {
      return jsonResponse({ error: "invalid symbol format, expected BASE/QUOTE" }, 400);
    }

    cacheKey = `${action}|${exchange}|${symbol}|${timeframe}|${limit ?? ""}`;
    const cached = cacheGet(cacheKey, CACHE_MS[action] ?? 2000);
    if (cached) return jsonResponse({ cached: true, data: cached });

    // Per-exchange cooldown short-circuit for single-exchange endpoints.
    if (
      (action === "ticker" || action === "orderbook" || action === "trades" || action === "ohlcv") &&
      isOnCooldown(exchange)
    ) {
      const stale = cacheGetStale(cacheKey);
      if (stale) return jsonResponse({ cached: true, stale: true, data: stale });
      return jsonResponse({ error: `${exchange} temporarily rate-limited, retry shortly` }, 503);
    }

    let data: unknown;
    try {
      switch (action) {
        case "exchanges": data = SUPPORTED_EXCHANGES; break;
        case "ticker":    data = await handleTicker(exchange, symbol); break;
        case "orderbook": data = await handleOrderBook(exchange, symbol, limit ?? 20); break;
        case "trades":    data = await handleTrades(exchange, symbol, limit ?? 50); break;
        case "ohlcv":     data = await handleOHLCV(exchange, symbol, timeframe, limit ?? 100); break;
        case "funding":   data = await handleFunding(symbol); break;
        case "compare":   data = await handleCompare(symbol); break;
        default:
          return jsonResponse({ error: `unknown action: ${action}` }, 400);
      }
    } catch (handlerErr) {
      // If single-exchange endpoint hit a rate limit, mark cooldown.
      if (
        isRateLimitError(handlerErr) &&
        (action === "ticker" || action === "orderbook" || action === "trades" || action === "ohlcv")
      ) {
        markCooldown(exchange, 10 * 60 * 1000);
      }
      // Stale-while-error: serve last cached value if we have one.
      const stale = cacheGetStale(cacheKey);
      if (stale) {
        console.warn(`market-data-ccxt: serving stale for ${cacheKey} due to`, (handlerErr as Error).message);
        return jsonResponse({ cached: true, stale: true, data: stale });
      }
      throw handlerErr;
    }

    cacheSet(cacheKey, data);
    return jsonResponse({ cached: false, data });
  } catch (e) {
    console.error("market-data-ccxt error:", e);
    return jsonResponse({ error: (e as Error).message ?? "internal error" }, 500);
  }
});
