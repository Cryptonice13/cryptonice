import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';

export interface TradingStrategy {
  id: string;
  user_id: string;
  name: string;
  type: string;
  assets: string[];
  exchange: string;
  timeframe: string;
  params: any;
  status: 'draft' | 'active' | 'paused';
  source: 'ai' | 'user';
  description: string | null;
  last_backtest_score: number | null;
  created_at: string;
  updated_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function useStrategies() {
  const { user } = useAuth();
  const { address } = useAccount();
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) { setStrategies([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('trading_strategies')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setStrategies((data as any) || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const generate = useCallback(async (prompt: string): Promise<TradingStrategy | null> => {
    setError(null);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token || ANON;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-strategy-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: ANON },
      body: JSON.stringify({ prompt, walletAddress: address }),
    });
    if (res.ok) window.dispatchEvent(new CustomEvent('credits-updated'));
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error || `Failed (${res.status})`); return null; }
    const spec = json.strategy;
    if (!user?.id) { setError('Sign in required'); return null; }
    const { data: inserted, error: insErr } = await supabase
      .from('trading_strategies')
      .insert({
        user_id: user.id,
        name: spec.name,
        type: spec.type,
        assets: spec.assets,
        exchange: spec.exchange,
        timeframe: spec.timeframe,
        params: spec.params,
        description: spec.description,
        source: 'ai',
        status: 'draft',
      })
      .select('*')
      .single();
    if (insErr) { setError(insErr.message); return null; }
    setStrategies(prev => [inserted as any, ...prev]);
    return inserted as any;
  }, [user?.id, address]);

  const remove = useCallback(async (id: string) => {
    const prev = strategies;
    setStrategies(s => s.filter(x => x.id !== id));
    const { error } = await supabase.from('trading_strategies').delete().eq('id', id);
    if (error) { setError(error.message); setStrategies(prev); }
  }, [strategies]);

  const setStatus = useCallback(async (id: string, status: TradingStrategy['status']) => {
    setStrategies(s => s.map(x => x.id === id ? { ...x, status } : x));
    await supabase.from('trading_strategies').update({ status }).eq('id', id);
  }, []);

  return { strategies, loading, error, generate, remove, setStatus, reload: load };
}
