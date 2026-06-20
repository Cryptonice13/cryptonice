import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PortfolioTarget {
  id: string;
  weights: { symbol: string; weight: number }[];
  rationale: string | null;
  generated_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function usePortfolioOptimizer() {
  const { user } = useAuth();
  const [target, setTarget] = useState<PortfolioTarget | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('portfolio_targets')
      .select('*').order('generated_at', { ascending: false }).limit(1).maybeSingle();
    setTarget((data as any) || null);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const optimize = useCallback(async (riskTolerance: 'low' | 'medium' | 'high', horizon: 'short' | 'medium' | 'long') => {
    setLoading(true); setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token || ANON;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-optimize-portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: ANON },
        body: JSON.stringify({ riskTolerance, horizon }),
      });
      if (res.ok) window.dispatchEvent(new CustomEvent('credits-updated'));
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || `Failed (${res.status})`); return null; }
      setTarget(json.target as any);
      return json.target as PortfolioTarget;
    } finally { setLoading(false); }
  }, []);

  return { target, loading, error, optimize, reload: load };
}
