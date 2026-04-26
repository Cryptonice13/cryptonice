import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { checkAndDeductCredits } from '@/lib/credits';

export interface ConditionRule {
  asset_id: string;
  asset_symbol: string;
  metric: string;
  operator: string;
  value: number;
}

export interface ConditionalAlert {
  id: string;
  name: string;
  natural_language: string;
  conditions: ConditionRule[];
  logic: 'AND' | 'OR';
  assets_involved: string[];
  status: 'active' | 'paused' | 'triggered';
  triggered_at?: string;
  triggered_data?: any;
  last_evaluated_at?: string;
  created_at: string;
}

const PARSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-conditional-alert`;

export function useConditionalAlerts() {
  const { user } = useAuth();
  const { address } = useAccount();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<ConditionalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id && !address) return;
    setIsLoading(true);
    try {
      let q = supabase.from('conditional_alerts' as any).select('*').order('created_at', { ascending: false });
      if (user?.id) q = q.eq('user_id', user.id);
      else q = q.eq('wallet_address', address!).is('user_id', null);
      const { data } = await q;
      setAlerts((data || []) as any);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, address]);

  useEffect(() => { load(); }, [load]);

  const parsePrompt = useCallback(async (prompt: string) => {
    setIsParsing(true);
    try {
      const r = await fetch(PARSE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast({ title: 'Parse failed', description: data.error, variant: 'destructive' });
        return null;
      }
      return data.parsed as { name: string; logic: 'AND' | 'OR'; conditions: ConditionRule[] };
    } catch (e) {
      toast({ title: 'Network error', variant: 'destructive' });
      return null;
    } finally {
      setIsParsing(false);
    }
  }, [toast]);

  const createAlert = useCallback(async (
    parsed: { name: string; logic: 'AND' | 'OR'; conditions: ConditionRule[] },
    naturalLanguage: string
  ) => {
    if (!user?.id && !address) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return null;
    }
    const credit = await checkAndDeductCredits(2, 'AI Conditional Alert', { userId: user?.id, walletAddress: address });
    if (!credit.success) {
      toast({ title: 'Insufficient credits', description: '2 credits required.', variant: 'destructive' });
      return null;
    }

    const row: any = {
      name: parsed.name,
      natural_language: naturalLanguage,
      conditions: parsed.conditions,
      logic: parsed.logic,
      assets_involved: [...new Set(parsed.conditions.map(c => c.asset_id))],
      status: 'active',
    };
    if (user?.id) row.user_id = user.id;
    else if (address) row.wallet_address = address;

    const { data, error } = await (supabase.from('conditional_alerts' as any) as any).insert(row).select().single();
    if (error) {
      toast({ title: 'Failed to create', description: error.message, variant: 'destructive' });
      return null;
    }
    toast({ title: 'Conditional alert created', description: 'Will evaluate every 5 minutes.' });
    await load();
    return data as any;
  }, [user?.id, address, toast, load]);

  const togglePause = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await (supabase.from('conditional_alerts' as any) as any).update({ status: newStatus }).eq('id', id);
    toast({ title: newStatus === 'paused' ? 'Alert paused' : 'Alert resumed' });
    await load();
  }, [toast, load]);

  const deleteAlert = useCallback(async (id: string) => {
    await (supabase.from('conditional_alerts' as any) as any).delete().eq('id', id);
    toast({ title: 'Alert deleted' });
    await load();
  }, [toast, load]);

  const resetTriggered = useCallback(async (id: string) => {
    await (supabase.from('conditional_alerts' as any) as any)
      .update({ status: 'active', triggered_at: null, triggered_data: null })
      .eq('id', id);
    toast({ title: 'Alert reactivated' });
    await load();
  }, [toast, load]);

  return { alerts, isLoading, isParsing, parsePrompt, createAlert, togglePause, deleteAlert, resetTriggered, reload: load };
}
