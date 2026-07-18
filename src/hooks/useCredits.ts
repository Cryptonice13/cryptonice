import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

const PLANS = {
  basic: { price: 5, credits: 150 },
  pro: { price: 25, credits: 800 },
  enterprise: { price: 100, credits: 3500 },
};

const COUPON_CODE = 'CryptoAI';
const COUPON_BONUS = 0.2; // 20% bonus credits

export function useCredits() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { address } = useAccount();
  const { toast } = useToast();

  const userId = user?.id;
  const walletAddr = address;

  const fetchBalance = useCallback(async () => {
    if (!userId && !walletAddr) { setBalance(null); setIsLoading(false); return; }

    try {
      // Ensure account exists (idempotent) and get the current balance
      const { data: ensured, error: ensureErr } = await (supabase as any).rpc('ensure_credits_account', {
        _user_id: userId ?? null,
        _wallet: userId ? null : walletAddr,
      });
      if (ensureErr) {
        console.error('ensure_credits_account error:', ensureErr);
      }

      // Try daily login bonus (RPC is idempotent per UTC day)
      const { data: claimed } = await (supabase as any).rpc('claim_daily_bonus', {
        _user_id: userId ?? null,
        _wallet: userId ? null : walletAddr,
      });

      const finalBalance = typeof claimed === 'number' && claimed >= 0
        ? claimed
        : (typeof ensured === 'number' ? ensured : null);

      if (finalBalance !== null) {
        setBalance(finalBalance);
      } else {
        // Fallback: read directly (SELECT still allowed by RLS)
        let q = supabase.from('user_credits' as any).select('balance').limit(1);
        if (userId) q = q.eq('user_id', userId);
        else q = q.eq('wallet_address', walletAddr);
        const { data } = await q;
        const rows = data as any[];
        setBalance(rows?.[0]?.balance ?? 0);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, walletAddr]);

  const deductCredits = useCallback(async (amount: number, description: string): Promise<boolean> => {
    if (!userId && !walletAddr) return false;

    const { data, error } = await (supabase as any).rpc('deduct_credits_atomic', {
      _user_id: userId ?? null,
      _wallet: userId ? null : walletAddr,
      _amount: amount,
      _description: description,
    });

    if (error) {
      console.error('deduct_credits_atomic error:', error);
      toast({
        title: 'Credit deduction failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return false;
    }
    const newBalance = typeof data === 'number' ? data : -1;
    if (newBalance < 0) {
      toast({
        title: 'Insufficient Credits',
        description: "You don't have enough credits. Please purchase more.",
        variant: 'destructive',
      });
      return false;
    }
    setBalance(newBalance);
    return true;
  }, [userId, walletAddr, toast]);

  const purchaseCredits = useCallback(async (plan: keyof typeof PLANS, couponCode?: string) => {
    if (!userId && !walletAddr) return false;
    const planDetails = PLANS[plan];
    if (!planDetails) return false;

    let credits = planDetails.credits;
    const validCoupon = couponCode?.trim().toUpperCase() === COUPON_CODE.toUpperCase();
    if (validCoupon) {
      credits = Math.floor(credits * (1 + COUPON_BONUS));
    }

    // Purchase records are written server-side by the Stripe webhook (trusted role only).
    void plan; void planDetails;

    const { data, error } = await (supabase as any).rpc('add_credits', {
      _user_id: userId ?? null,
      _wallet: userId ? null : walletAddr,
      _amount: credits,
      _type: 'purchase',
      _description: `Purchased ${plan} plan - ${credits} credits`,
    });

    if (error) {
      console.error('add_credits error:', error);
      toast({ title: 'Purchase failed', description: 'Please try again.', variant: 'destructive' });
      return false;
    }
    if (typeof data === 'number') setBalance(data);

    toast({
      title: 'Credits Purchased!',
      description: `${credits} credits added to your account${validCoupon ? ' (20% bonus applied!)' : ''}.`,
    });

    return true;
  }, [userId, walletAddr, toast]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Listen for credit deductions from standalone helpers
  useEffect(() => {
    const handler = () => fetchBalance();
    window.addEventListener('credits-updated', handler);
    return () => window.removeEventListener('credits-updated', handler);
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    deductCredits,
    purchaseCredits,
    refreshBalance: fetchBalance,
    PLANS,
  };
}
