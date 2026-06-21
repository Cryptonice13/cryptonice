import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ToolCall } from '@/components/ai/AgentToolCard';

const TRADING_AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-trading-agent`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface TradingAgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TradingAgentResponse {
  content: string;
  toolCalls: ToolCall[];
}

/**
 * Detects whether a user prompt should be routed to the Trading Agent
 * (Auto-Trader tool layer) instead of the general crypto-ai analyst.
 */
export function isTradingIntent(input: string): boolean {
  const s = input.toLowerCase();
  // Strong, unambiguous signals — keep this list tight to avoid false positives.
  const keywords = [
    'strategy', 'strategies',
    'backtest', 'back test', 'back-test',
    'paper trade', 'paper trading', 'paper account', 'paper position',
    'agent tick', 'run tick', 'run a tick',
    'auto trader', 'autotrader', 'auto-trader',
    'arbitrage', 'arb opportunit',
    'optimize portfolio', 'portfolio optimiz', 'target weights', 'rebalance',
    'activate strateg', 'pause strateg',
    'trading journal', 'evaluate journal', 'journal analysis',
    'sma cross', 'sma_cross', 'rsi strategy', 'breakout strategy', 'macd strategy',
  ];
  return keywords.some(k => s.includes(k));
}

export async function callTradingAgent(messages: TradingAgentMessage[]): Promise<TradingAgentResponse> {
  const { data: sess } = await supabase.auth.getSession();
  const accessToken = sess?.session?.access_token;
  if (!accessToken) {
    throw new Error('Please sign in to use the Trading Agent.');
  }

  const res = await fetch(TRADING_AGENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    let msg = `Trading agent failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* keep default */ }
    throw new Error(msg);
  }

  const data = await res.json();
  return {
    content: data.content || '',
    toolCalls: Array.isArray(data.toolCalls) ? data.toolCalls : [],
  };
}

export function useTradingAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (messages: TradingAgentMessage[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await callTradingAgent(messages);
      window.dispatchEvent(new CustomEvent('credits-updated'));
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Trading agent failed';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { send, isLoading, error };
}
