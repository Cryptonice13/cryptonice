import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ExchangeId, Timeframe } from "@/lib/exchangeSymbols";

type Action = "ticker" | "orderbook" | "trades" | "ohlcv" | "funding" | "compare";

interface InvokeArgs {
  action: Action;
  exchange?: ExchangeId;
  symbol: string;
  timeframe?: Timeframe;
  limit?: number;
}

async function invokeMarket<T>(args: InvokeArgs): Promise<T> {
  const { data, error } = await supabase.functions.invoke("market-data-ccxt", { body: args });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.data as T;
}

interface UsePollOpts {
  intervalMs: number;
  enabled?: boolean;
}

function usePoll<T>(fetcher: () => Promise<T>, deps: unknown[], opts: UsePollOpts) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const cancelled = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    try {
      const r = await fetcherRef.current();
      if (cancelled.current) return;
      setData(r);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      if (cancelled.current) return;
      setError(e instanceof Error ? e.message : "fetch error");
    } finally {
      if (!cancelled.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    if (opts.enabled === false) {
      setIsLoading(false);
      return () => { cancelled.current = true; };
    }
    setIsLoading(true);
    run();
    const id = setInterval(run, opts.intervalMs);
    return () => {
      cancelled.current = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, opts.intervalMs, opts.enabled]);

  return { data, isLoading, error, lastUpdated, refresh: run };
}

export interface Ticker {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  open: number;
  baseVolume: number;
  quoteVolume: number;
  percentage: number;
  change: number;
  timestamp: number;
}

export interface OrderBook {
  symbol: string;
  bids: { price: number; amount: number }[];
  asks: { price: number; amount: number }[];
  timestamp: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  side: "buy" | "sell";
  price: number;
  amount: number;
  cost: number;
}

export interface Candle { t: number; o: number; h: number; l: number; c: number; v: number }

export interface Funding {
  exchange: string;
  symbol: string;
  fundingRate: number;
  nextFundingTimestamp: number;
  markPrice: number;
  indexPrice: number;
}

export interface CompareResult {
  symbol: string;
  results: Array<{
    exchange: string;
    ok: boolean;
    last?: number;
    bid?: number;
    ask?: number;
    baseVolume?: number;
    quoteVolume?: number;
    percentage?: number;
    error?: string;
  }>;
  bestBidExchange?: string;
  bestAskExchange?: string;
  spreadPct: number;
}

export function useTicker(exchange: ExchangeId, symbol: string, intervalMs = 3000) {
  return usePoll<Ticker>(
    () => invokeMarket<Ticker>({ action: "ticker", exchange, symbol }),
    [exchange, symbol],
    { intervalMs },
  );
}

export function useOrderBook(exchange: ExchangeId, symbol: string, intervalMs = 2000) {
  return usePoll<OrderBook>(
    () => invokeMarket<OrderBook>({ action: "orderbook", exchange, symbol, limit: 20 }),
    [exchange, symbol],
    { intervalMs },
  );
}

export function useTrades(exchange: ExchangeId, symbol: string, intervalMs = 3000) {
  return usePoll<Trade[]>(
    () => invokeMarket<Trade[]>({ action: "trades", exchange, symbol, limit: 50 }),
    [exchange, symbol],
    { intervalMs },
  );
}

export function useOHLCV(exchange: ExchangeId, symbol: string, timeframe: Timeframe, intervalMs = 30000) {
  return usePoll<Candle[]>(
    () => invokeMarket<Candle[]>({ action: "ohlcv", exchange, symbol, timeframe, limit: 100 }),
    [exchange, symbol, timeframe],
    { intervalMs },
  );
}

export function useFunding(symbol: string, intervalMs = 60000) {
  return usePoll<Funding>(
    () => invokeMarket<Funding>({ action: "funding", symbol }),
    [symbol],
    { intervalMs },
  );
}

export function useArbitrage(symbol: string, intervalMs = 10000) {
  return usePoll<CompareResult>(
    () => invokeMarket<CompareResult>({ action: "compare", symbol }),
    [symbol],
    { intervalMs },
  );
}
