import { supabase } from '@/integrations/supabase/client';

/**
 * Standalone credit helpers backed by atomic server-side RPCs.
 * The DB enforces identity matching and balance checks; client cannot bypass.
 */

interface CreditIdentity {
  userId?: string;
  walletAddress?: string;
}

export async function checkAndDeductCredits(
  amount: number,
  description: string,
  identity: CreditIdentity
): Promise<{ success: boolean; newBalance?: number }> {
  const { userId, walletAddress } = identity;
  if (!userId && !walletAddress) return { success: false };

  const { data, error } = await (supabase as any).rpc('deduct_credits_atomic', {
    _user_id: userId ?? null,
    _wallet: userId ? null : walletAddress,
    _amount: amount,
    _description: description,
  });

  if (error) {
    console.error('deduct_credits_atomic failed:', error);
    return { success: false };
  }
  const newBalance = typeof data === 'number' ? data : -1;
  if (newBalance < 0) return { success: false };

  window.dispatchEvent(new CustomEvent('credits-updated'));
  return { success: true, newBalance };
}
