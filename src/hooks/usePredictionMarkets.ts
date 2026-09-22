import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { CreateMarketInput, OrderInput } from '@/lib/predictionMarkets';

export interface PredictionMarket {
  id: string;
  creator_id: string;
  question: string;
  asset_symbol: string;
  target_price: number;
  direction: 'above' | 'below';
  close_at: string;
  resolve_at: string;
  resolution_source: string;
  status: string;
  outcome: string | null;
  observed_price: number | null;
  resolved_at: string | null;
  settlement_note: string | null;
  yes_price: number;
  no_price: number;
  volume_credits: number;
  participant_count: number;
  created_at: string;
  creator_name?: string;
}

export interface PredictionPosition {
  id: string;
  market_id: string;
  side: 'yes' | 'no';
  quantity: number;
  average_price: number;
  total_cost: number;
  payout: number;
  settled_at: string | null;
  market?: PredictionMarket;
}

export interface PredictionTrade {
  id: string;
  market_id: string;
  side: 'yes' | 'no';
  price: number;
  quantity: number;
  created_at: string;
}

const db = supabase as any;

export function usePredictionMarkets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [positions, setPositions] = useState<PredictionPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: marketsError } = await db
      .from('prediction_markets')
      .select('*')
      .order('close_at', { ascending: true })
      .limit(60);

    if (marketsError) {
      console.error('Error loading prediction markets:', marketsError);
      setError('We could not load the markets. Please try again.');
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as PredictionMarket[];
    const creatorIds = Array.from(new Set(rows.map(m => m.creator_id)));
    let names: Record<string, string> = {};

    if (creatorIds.length > 0) {
      const { data: profiles } = await db.rpc('get_public_profiles', { _ids: creatorIds });
      (profiles ?? []).forEach((p: { user_id: string; name: string | null }) => {
        names[p.user_id] = p.name || 'Trader';
      });
    }

    setMarkets(rows.map(m => ({ ...m, creator_name: names[m.creator_id] || 'Trader' })));
    setLoading(false);
  }, []);

  const fetchPositions = useCallback(async () => {
    if (!user) {
      setPositions([]);
      return;
    }

    const { data, error: positionsError } = await db
      .from('prediction_positions')
      .select('*, market:prediction_markets(*)')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (positionsError) {
      console.error('Error loading positions:', positionsError);
      return;
    }
    setPositions((data ?? []) as PredictionPosition[]);
  }, [user]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchMarkets(), fetchPositions()]);
  }, [fetchMarkets, fetchPositions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const callService = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error: fnError } = await db.functions.invoke('prediction-markets', { body: payload });
    if (fnError) {
      const message = (data as { error?: string })?.error || 'Something went wrong. Please try again.';
      throw new Error(message);
    }
    if ((data as { error?: string })?.error) {
      throw new Error((data as { error: string }).error);
    }
    return data;
  }, []);

  const createMarket = useCallback(async (input: CreateMarketInput): Promise<boolean> => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to create a market.', variant: 'destructive' });
      return false;
    }
    setSubmitting(true);
    try {
      await callService({ action: 'create_market', ...input });
      toast({ title: 'Market created', description: 'Your market is now open for trading.' });
      await refresh();
      return true;
    } catch (e) {
      toast({
        title: 'Could not create market',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, callService, refresh, toast]);

  const placeOrder = useCallback(async (marketId: string, input: OrderInput): Promise<boolean> => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to trade.', variant: 'destructive' });
      return false;
    }
    setSubmitting(true);
    try {
      await callService({ action: 'place_order', marketId, ...input });
      toast({
        title: 'Trade placed',
        description: `${input.quantity} ${input.side.toUpperCase()} shares at ${input.price} credits each.`,
      });
      window.dispatchEvent(new CustomEvent('credits-updated'));
      await refresh();
      return true;
    } catch (e) {
      toast({
        title: 'Trade failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, callService, refresh, toast]);

  const settleDueMarkets = useCallback(async () => {
    try {
      await callService({ action: 'settle_due' });
      await refresh();
    } catch (e) {
      console.error('settle_due failed:', e);
    }
  }, [callService, refresh]);

  return {
    markets,
    positions,
    loading,
    submitting,
    error,
    createMarket,
    placeOrder,
    settleDueMarkets,
    refresh,
  };
}

export function useMarketTrades(marketId: string | null) {
  const [trades, setTrades] = useState<PredictionTrade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!marketId) {
      setTrades([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    db.from('prediction_trades')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }: { data: unknown; error: unknown }) => {
        if (cancelled) return;
        if (error) console.error('Error loading market activity:', error);
        setTrades((data ?? []) as PredictionTrade[]);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [marketId]);

  return { trades, loading };
}
