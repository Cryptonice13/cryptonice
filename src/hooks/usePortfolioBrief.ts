import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { checkAndDeductCredits } from '@/lib/credits';
import { useToast } from '@/hooks/use-toast';

export interface PortfolioBrief {
  id: string;
  brief_date: string;
  total_value: number;
  day_change_pct: number;
  brief_data: {
    summary: string;
    top_movers: { symbol: string; change_pct: number; contribution_usd: number; direction: 'up' | 'down' }[];
    why_explanations: { symbol: string; reason: string }[];
    news_drivers: { title: string; impact: 'high' | 'medium' | 'low'; affected_symbols: string[] }[];
    outlook: { sentiment: string; next_24h: string };
  };
  created_at: string;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portfolio-brief`;

export function usePortfolioBrief() {
  const { user } = useAuth();
  const { address } = useAccount();
  const { toast } = useToast();
  const [todayBrief, setTodayBrief] = useState<PortfolioBrief | null>(null);
  const [history, setHistory] = useState<PortfolioBrief[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.id && !address) return;
    setIsLoading(true);
    try {
      let q = supabase.from('portfolio_briefs').select('*').order('brief_date', { ascending: false }).limit(7);
      if (user?.id) q = q.eq('user_id', user.id);
      else q = q.eq('wallet_address', address!).is('user_id', null);
      const { data } = await q;
      const list = (data || []) as any as PortfolioBrief[];
      setHistory(list);
      const today = new Date().toISOString().slice(0, 10);
      setTodayBrief(list.find(b => b.brief_date === today) || null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, address]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const generateBrief = useCallback(async (portfolio: { symbol: string; asset_id: string; name?: string; amount: number; avg_buy_price: number }[]) => {
    if (portfolio.length === 0) {
      toast({ title: 'Add positions first', description: 'Need at least one portfolio holding to generate a brief.', variant: 'destructive' });
      return null;
    }
    if (!user?.id && !address) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return null;
    }

    const credit = await checkAndDeductCredits(3, 'Daily Portfolio Brief', { userId: user?.id, walletAddress: address });
    if (!credit.success) {
      toast({ title: 'Insufficient credits', description: 'You need 3 credits to generate a brief.', variant: 'destructive' });
      return null;
    }

    setIsGenerating(true);
    try {
      const resp = await fetch(FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ portfolio, userId: user?.id, walletAddress: address }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast({ title: 'Brief generation failed', description: data.error || 'Try again later', variant: 'destructive' });
        return null;
      }
      await loadHistory();
      toast({ title: data.cached ? "Today's brief loaded" : "Brief ready" });
      return data.brief as PortfolioBrief;
    } catch (e) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user?.id, address, toast, loadHistory]);

  return { todayBrief, history, isLoading, isGenerating, generateBrief, reload: loadHistory };
}
