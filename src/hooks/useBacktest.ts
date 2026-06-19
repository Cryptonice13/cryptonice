import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface BacktestMetrics {
  startEquity: number;
  finalEquity: number;
  totalReturnPct: number;
  tradesCount: number;
  winRate: number;
  profitFactor: number | null;
  maxDrawdownPct: number;
  sharpe: number;
}
export interface BacktestResult {
  metrics: BacktestMetrics;
  equityCurve: { t: number; equity: number }[];
  trades: any[];
  symbol: string; exchange: string; timeframe: string; candlesCount: number;
}

export function useBacktest() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (opts: {
    strategyId?: string;
    symbol: string;
    exchange: string;
    timeframe: string;
    params: any;
    limit?: number;
  }) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token || ANON;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: ANON },
        body: JSON.stringify(opts),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || `Failed (${res.status})`); return null; }
      setResult(json);
      return json as BacktestResult;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, run, reset: () => setResult(null) };
}
