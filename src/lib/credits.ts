import { supabase } from '@/integrations/supabase/client';

/**
 * Standalone credit helpers that can be called from any hook or component.
 * These work directly with Supabase without requiring React hooks.
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

  // Fetch current balance
  let query = supabase.from('user_credits' as any).select('balance').limit(1);
  if (userId) query = query.eq('user_id', userId);
  else query = query.eq('wallet_address', walletAddress);

  const { data } = await query;
  const rows = data as any[];
  if (!rows || rows.length === 0) return { success: false };

  const currentBalance = rows[0].balance;
  if (currentBalance < amount) return { success: false };

  const newBalance = currentBalance - amount;

  // Update balance
  let updateQuery = (supabase.from('user_credits' as any) as any).update({ balance: newBalance });
  if (userId) updateQuery = updateQuery.eq('user_id', userId);
  else updateQuery = updateQuery.eq('wallet_address', walletAddress);
  await updateQuery;

  // Log transaction
  const txData: any = { amount: -amount, transaction_type: 'usage', description };
  if (userId) txData.user_id = userId;
  else txData.wallet_address = walletAddress;
  await (supabase.from('credit_transactions' as any) as any).insert(txData);

  window.dispatchEvent(new CustomEvent('credits-updated'));
  return { success: true, newBalance };
}
