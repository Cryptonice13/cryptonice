export const COINBASE_PRODUCTS: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  BNB: "BNB-USD",
  XRP: "XRP-USD",
  ADA: "ADA-USD",
  DOGE: "DOGE-USD",
  AVAX: "AVAX-USD",
  DOT: "DOT-USD",
  LINK: "LINK-USD",
  MATIC: "MATIC-USD",
  UNI: "UNI-USD",
  LTC: "LTC-USD",
  ATOM: "ATOM-USD",
  ARB: "ARB-USD",
  OP: "OP-USD",
};

export const MAX_TRADE_AGE_MS = 120_000;
export const MAX_AFTER_RESOLUTION_MS = 30_000;
const MAX_FUTURE_SKEW_MS = 5_000;
const REQUEST_TIMEOUT_MS = 8_000;

export interface FreshSpotQuote {
  exchange: "Coinbase";
  pair: string;
  price: number;
  quoteAt: string;
  fetchedAt: string;
}

export function parseFreshSpotQuote(
  symbol: string,
  payload: unknown,
  nowMs = Date.now(),
  resolutionAtMs = nowMs,
): FreshSpotQuote | null {
  const pair = COINBASE_PRODUCTS[symbol.toUpperCase()];
  if (!pair || typeof payload !== "object" || payload === null) return null;

  const data = payload as { price?: unknown; time?: unknown };
  const price = typeof data.price === "number" || typeof data.price === "string"
    ? Number(data.price)
    : Number.NaN;
  const quoteTimeMs = typeof data.time === "string" ? Date.parse(data.time) : Number.NaN;
  const ageMs = nowMs - quoteTimeMs;
  const resolutionOffsetMs = quoteTimeMs - resolutionAtMs;

  if (
    !Number.isFinite(price) || price <= 0 || !Number.isFinite(quoteTimeMs) ||
    ageMs > MAX_TRADE_AGE_MS || ageMs < -MAX_FUTURE_SKEW_MS ||
    resolutionOffsetMs < -MAX_TRADE_AGE_MS || resolutionOffsetMs > MAX_AFTER_RESOLUTION_MS
  ) {
    return null;
  }

  return {
    exchange: "Coinbase",
    pair,
    price,
    quoteAt: new Date(quoteTimeMs).toISOString(),
    fetchedAt: new Date(nowMs).toISOString(),
  };
}

export async function fetchFreshSpotQuote(
  symbol: string,
  resolutionAtMs = Date.now(),
): Promise<FreshSpotQuote | null> {
  const pair = COINBASE_PRODUCTS[symbol.toUpperCase()];
  if (!pair) return null;

  try {
    const response = await fetch(`https://api.exchange.coinbase.com/products/${pair}/ticker`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const payload: unknown = await response.json();
    return parseFreshSpotQuote(symbol, payload, Date.now(), resolutionAtMs);
  } catch {
    return null;
  }
}