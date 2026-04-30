import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { checkAndDeductCredits } from '@/lib/credits';

export interface PublishedSignal {
  id: string;
  publisher_user_id: string;
  asset_id: string;
  asset_symbol: string;
  asset_name?: string;
  asset_logo?: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  entry_price: number;
  stop_loss: number;
  take_profits: number[];
  timeframe: string;
  reasoning: string;
  published_at: string;
  status: 'active' | 'closed' | 'expired';
  outcome?: 'win' | 'loss' | 'breakeven' | 'pending' | 'expired';
  pnl_pct?: number;
  closed_price?: number;
  closed_at?: string;
}

export interface PublisherStats {
  publisher_user_id: string;
  publisher_name: string | null;
  publisher_avatar: string | null;
  total_signals: number;
  active_signals: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_pnl_pct: number;
  total_pnl_pct: number;
  follower_count: number;
  last_signal_at: string;
}

export function useSignalMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<PublisherStats[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await (supabase.from('publisher_stats' as any) as any)
        .select('*')
        .order('total_pnl_pct', { ascending: false })
        .limit(50);
      setLeaderboard((data || []) as any);

      if (user?.id) {
        const { data: follows } = await (supabase.from('signal_followers' as any) as any)
          .select('publisher_user_id')
          .eq('follower_user_id', user.id);
        setFollowingIds(new Set(((follows || []) as any).map((f: any) => f.publisher_user_id)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const publishSignal = useCallback(async (params: Omit<PublishedSignal, 'id' | 'publisher_user_id' | 'published_at' | 'status' | 'outcome' | 'pnl_pct' | 'closed_price' | 'closed_at'>) => {
    if (!user?.id) {
      toast({ title: 'Sign in required to publish signals', variant: 'destructive' });
      return null;
    }
    const credit = await checkAndDeductCredits(2, 'Publish Trading Signal', { userId: user.id });
    if (!credit.success) {
      toast({ title: 'Insufficient credits', description: '2 credits required to publish.', variant: 'destructive' });
      return null;
    }

    const { data, error } = await (supabase.from('published_signals' as any) as any).insert({
      ...params,
      publisher_user_id: user.id,
      status: 'active',
      outcome: 'pending',
    }).select().single();

    if (error) {
      toast({ title: 'Publish failed', description: error.message, variant: 'destructive' });
      return null;
    }
    toast({ title: 'Signal published!', description: 'Your signal is now public and being tracked.' });
    await loadLeaderboard();
    return data as any;
  }, [user?.id, toast, loadLeaderboard]);

  const followPublisher = useCallback(async (publisherId: string) => {
    if (!user?.id) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    if (publisherId === user.id) {
      toast({ title: "Can't follow yourself", variant: 'destructive' });
      return;
    }
    const isFollowing = followingIds.has(publisherId);
    if (isFollowing) {
      await (supabase.from('signal_followers' as any) as any)
        .delete()
        .eq('follower_user_id', user.id)
        .eq('publisher_user_id', publisherId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(publisherId); return n; });
      toast({ title: 'Unfollowed' });
    } else {
      await (supabase.from('signal_followers' as any) as any).insert({
        follower_user_id: user.id,
        publisher_user_id: publisherId,
      });
      setFollowingIds(prev => new Set(prev).add(publisherId));
      toast({ title: 'Following' });
    }
    await loadLeaderboard();
  }, [user?.id, followingIds, toast, loadLeaderboard]);

  const getPublisherSignals = useCallback(async (publisherId: string): Promise<PublishedSignal[]> => {
    const { data } = await (supabase.from('published_signals' as any) as any)
      .select('*')
      .eq('publisher_user_id', publisherId)
      .order('published_at', { ascending: false })
      .limit(50);
    return (data || []) as any;
  }, []);

  const getMyPublishedSignals = useCallback(async (): Promise<PublishedSignal[]> => {
    if (!user?.id) return [];
    const { data } = await (supabase.from('published_signals' as any) as any)
      .select('*')
      .eq('publisher_user_id', user.id)
      .order('published_at', { ascending: false });
    return (data || []) as any;
  }, [user?.id]);

  const deleteSignal = useCallback(async (id: string) => {
    if (!user?.id) return false;
    const { error } = await (supabase.from('published_signals' as any) as any)
      .delete()
      .eq('id', id)
      .eq('publisher_user_id', user.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Signal deleted' });
    await loadLeaderboard();
    return true;
  }, [user?.id, toast, loadLeaderboard]);

  const updateSignal = useCallback(async (
    id: string,
    updates: Partial<Pick<PublishedSignal, 'signal' | 'entry_price' | 'stop_loss' | 'take_profits' | 'timeframe' | 'reasoning'>>
  ) => {
    if (!user?.id) return false;
    const { error } = await (supabase.from('published_signals' as any) as any)
      .update(updates)
      .eq('id', id)
      .eq('publisher_user_id', user.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Signal updated' });
    await loadLeaderboard();
    return true;
  }, [user?.id, toast, loadLeaderboard]);

  return {
    leaderboard,
    followingIds,
    isLoading,
    publishSignal,
    followPublisher,
    getPublisherSignals,
    getMyPublishedSignals,
    deleteSignal,
    updateSignal,
    reload: loadLeaderboard,
  };
}
