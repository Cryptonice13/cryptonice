import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PaperAccount {
  id: string; user_id: string; base_currency: string;
  starting_balance: number; cash_balance: number; equity: number;
  updated_at: string; created_at: string;
}
export interface PaperPosition {
  id: string; symbol: string; exchange: string; qty: number; avg_entry: number;
  stop_loss: number | null; take_profit: number | null; strategy_id: string | null;
  opened_at: string;
}
export interface PaperTrade {
  id: string; symbol: string; exchange: string; side: string;
  qty: number; entry_price: number; exit_price: number;
  pnl: number; pnl_pct: number; opened_at: string; closed_at: string;
  reason_open: string | null; reason_close: string | null;
  strategy_id: string | null;
}
export interface PaperOrder {
  id: string; symbol: string; side: string; qty: number; price: number;
  fee: number; status: string; reason: string | null; filled_at: string;
  strategy_id: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function usePaperTrading() {
  const { user } = useAuth();
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [ticking, setTicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureAccount = useCallback(async () => {
    if (!user?.id) return null;
    const { data } = await supabase.from('paper_accounts').select('*').eq('user_id', user.id).maybeSingle();
    if (data) { setAccount(data as any); return data as any; }
    const { data: created, error } = await supabase.from('paper_accounts').insert({
      user_id: user.id, base_currency: 'USDT',
      starting_balance: 10000, cash_balance: 10000, equity: 10000,
    } as any).select('*').single();
    if (!error) setAccount(created as any);
    return created as any;
  }, [user?.id]);

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    await ensureAccount();
    const [{ data: p }, { data: t }, { data: o }] = await Promise.all([
      supabase.from('paper_positions').select('*').order('opened_at', { ascending: false }),
      supabase.from('paper_trades').select('*').order('closed_at', { ascending: false }).limit(100),
      supabase.from('paper_orders').select('*').order('filled_at', { ascending: false }).limit(50),
    ]);
    setPositions((p as any) || []); setTrades((t as any) || []); setOrders((o as any) || []);
  }, [user?.id, ensureAccount]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // realtime
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase.channel(`paper-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paper_positions', filter: `user_id=eq.${user.id}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paper_trades', filter: `user_id=eq.${user.id}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paper_orders', filter: `user_id=eq.${user.id}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paper_accounts', filter: `user_id=eq.${user.id}` }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, loadAll]);

  const runTick = useCallback(async () => {
    setError(null); setTicking(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token || ANON;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: ANON },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error || `Tick failed (${res.status})`);
      await loadAll();
      return json;
    } finally { setTicking(false); }
  }, [loadAll]);

  const resetAccount = useCallback(async () => {
    if (!user?.id || !account) return;
    await supabase.from('paper_positions').delete().eq('user_id', user.id);
    await supabase.from('paper_orders').delete().eq('user_id', user.id);
    await supabase.from('paper_trades').delete().eq('user_id', user.id);
    await supabase.from('paper_accounts').update({
      cash_balance: account.starting_balance, equity: account.starting_balance,
    }).eq('id', account.id);
    await loadAll();
  }, [user?.id, account, loadAll]);

  return { account, positions, trades, orders, ticking, error, runTick, resetAccount, reload: loadAll };
}
