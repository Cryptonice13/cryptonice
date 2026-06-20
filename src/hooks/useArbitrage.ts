import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ArbOpp {
  id: string; symbol: string;
  exchange_a: string; exchange_b: string;
  price_a: number; price_b: number;
  spread_bps: number; est_net_bps: number;
  detected_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function useArbitrage() {
  const [opps, setOpps] = useState<ArbOpp[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('arbitrage_opportunities')
      .select('*').order('detected_at', { ascending: false }).limit(50);
    setOpps((data as any) || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const scan = useCallback(async () => {
    setScanning(true); setError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-arbitrage-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}`, apikey: ANON },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error || `Scan failed (${res.status})`);
      await load();
    } finally { setScanning(false); }
  }, [load]);

  return { opps, scanning, error, scan, reload: load };
}
