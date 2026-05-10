import { supabase } from '@/integrations/supabase/client';

const CRYPTO_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-ai`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface CryptoAIRequest {
  type: string;
  messages?: any[];
  context?: any;
  walletAddress?: string;
}

/**
 * Invoke the crypto-ai edge function with the user's session JWT (if any),
 * plus their wallet address as a fallback identity. The edge function deducts
 * credits atomically server-side, so callers MUST NOT deduct client-side.
 */
export async function invokeCryptoAI(req: CryptoAIRequest): Promise<Response> {
  const { data: sess } = await supabase.auth.getSession();
  const accessToken = sess?.session?.access_token;
  const authToken = accessToken || ANON_KEY;

  const res = await fetch(CRYPTO_AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      type: req.type,
      messages: req.messages ?? [],
      context: req.context,
      walletAddress: req.walletAddress,
    }),
  });

  // Notify UI to refresh balance after a successful charge
  if (res.ok) {
    window.dispatchEvent(new CustomEvent('credits-updated'));
  }
  return res;
}

export async function readCryptoAIError(res: Response): Promise<string> {
  try {
    const data = await res.clone().json();
    if (res.status === 402) return data?.error || 'Insufficient credits — please purchase more.';
    if (res.status === 401) return 'Please sign in or connect a wallet to use AI features.';
    if (res.status === 429) return data?.error || 'Rate limit exceeded. Try again shortly.';
    return data?.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}
