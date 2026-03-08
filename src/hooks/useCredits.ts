import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

const PLANS = {
  basic: { price: 5, credits: 150 },
  pro: { price: 25, credits: 800 },
  enterprise: { price: 100, credits: 3500 },
} as const;

const COUPON_CODE = 'CryptoAI';
const COUPON_BONUS = 0.2; // 20%

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
      let query = supabase.from('user_credits' as any).select('*').limit(1);
      if (userId) query = query.eq('user_id', userId);
      else query = query.eq('wallet_address', walletAddr);

      const { data } = await query;
      const rows = data as any[];

      if (!rows || rows.length === 0) {
        // First time - create with signup bonus
        const insertData: any = { balance: 100 };
        if (userId) insertData.user_id = userId;
        else insertData.wallet_address = walletAddr;

        await (supabase.from('user_credits' as any) as any).insert(insertData);

        // Log signup bonus transaction
        const txData: any = { amount: 100, transaction_type: 'signup_bonus', description: 'Welcome bonus - 100 free credits' };
        if (userId) txData.user_id = userId;
        else txData.wallet_address = walletAddr;
        await (supabase.from('credit_transactions' as any) as any).insert(txData);

        setBalance(100);
      } else {
        setBalance(rows[0].balance);
      }

      // Check daily login bonus
      await checkDailyBonus();
    } catch (err) {
      console.error('Error fetching credits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, walletAddr]);

  const checkDailyBonus = useCallback(async () => {
    if (!userId && !walletAddr) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase.from('credit_transactions' as any)
      .select('id')
      .eq('transaction_type', 'daily_login')
      .gte('created_at', today.toISOString())
      .limit(1);

    if (userId) query = query.eq('user_id', userId);
    else query = query.eq('wallet_address', walletAddr);

    const { data } = await query;
    if (data && (data as any[]).length === 0) {
      // Grant daily bonus
      await addCreditsInternal(10, 'daily_login', 'Daily login bonus - 10 credits');
    }
  }, [userId, walletAddr]);

  const addCreditsInternal = useCallback(async (amount: number, type: string, description: string) => {
    if (!userId && !walletAddr) return;

    // Update balance
    let query = supabase.from('user_credits' as any).select('balance').limit(1);
    if (userId) query = query.eq('user_id', userId);
    else query = query.eq('wallet_address', walletAddr);

    const { data } = await query;
    const rows = data as any[];
    if (!rows || rows.length === 0) return;

    const newBalance = rows[0].balance + amount;
    let updateQuery = (supabase.from('user_credits' as any) as any).update({ balance: newBalance });
    if (userId) updateQuery = updateQuery.eq('user_id', userId);
    else updateQuery = updateQuery.eq('wallet_address', walletAddr);
    await updateQuery;

    // Log transaction
    const txData: any = { amount, transaction_type: type, description };
    if (userId) txData.user_id = userId;
    else txData.wallet_address = walletAddr;
    await (supabase.from('credit_transactions' as any) as any).insert(txData);

    setBalance(newBalance);
  }, [userId, walletAddr]);

  const deductCredits = useCallback(async (amount: number, description: string): Promise<boolean> => {
    if (balance === null || balance < amount) {
      toast({
        title: 'Insufficient Credits',
        description: 'You don\'t have enough credits. Please purchase more.',
        variant: 'destructive',
      });
      return false;
    }

    const newBalance = balance - amount;

    let updateQuery = (supabase.from('user_credits' as any) as any).update({ balance: newBalance });
    if (userId) updateQuery = updateQuery.eq('user_id', userId);
    else updateQuery = updateQuery.eq('wallet_address', walletAddr);
    await updateQuery;

    const txData: any = { amount: -amount, transaction_type: 'usage', description };
    if (userId) txData.user_id = userId;
    else txData.wallet_address = walletAddr;
    await (supabase.from('credit_transactions' as any) as any).insert(txData);

    setBalance(newBalance);
    return true;
  }, [balance, userId, walletAddr, toast]);

  const purchaseCredits = useCallback(async (plan: keyof typeof PLANS, couponCode?: string) => {
    const planDetails = PLANS[plan];
    if (!planDetails) return false;

    let credits = planDetails.credits;
    const validCoupon = couponCode?.trim().toUpperCase() === COUPON_CODE.toUpperCase();
    if (validCoupon) {
      credits = Math.floor(credits * (1 + COUPON_BONUS));
    }

    // Record purchase
    const purchaseData: any = {
      plan,
      credits,
      amount_usd: planDetails.price,
      coupon_code: validCoupon ? couponCode : null,
      status: 'completed',
    };
    if (userId) purchaseData.user_id = userId;
    else purchaseData.wallet_address = walletAddr;
    await (supabase.from('credit_purchases' as any) as any).insert(purchaseData);

    // Add credits
    await addCreditsInternal(credits, 'purchase', `Purchased ${plan} plan - ${credits} credits`);

    toast({
      title: 'Credits Purchased!',
      description: `${credits} credits added to your account${validCoupon ? ' (20% bonus applied!)' : ''}.`,
    });

    return true;
  }, [userId, walletAddr, addCreditsInternal, toast]);

  useEffect(() => {
    fetchBalance();
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
