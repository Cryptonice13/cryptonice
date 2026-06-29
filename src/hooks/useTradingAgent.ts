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
  const keywords = [
    'strategy', 'strategies',
    'backtest', 'back test', 'back-test',
    'paper trade', 'paper trading', 'paper account', 'paper position',
    'agent tick', 'run tick', 'run a tick', 'tick',
    'auto trader', 'autotrader', 'auto-trader',
    'arbitrage', 'arb opportunit', 'spread',
    'optimize portfolio', 'portfolio optimiz', 'target weights', 'rebalance', 'weights',
    'activate strateg', 'pause strateg',
    'trading journal', 'evaluate journal', 'journal analysis',
    'sma cross', 'sma_cross', 'rsi strategy', 'breakout strategy', 'macd strategy',
  ];
  return keywords.some(k => s.includes(k));
}

export type AgentEvent =
  | { type: 'step'; index: number; status: 'thinking' }
  | { type: 'tool_call'; id: string; name: string; args: any; status: 'running' }
  | { type: 'tool_result'; id: string; result: any; ms: number; status: 'done' | 'error' }
  | { type: 'text_delta'; delta: string }
  | { type: 'done'; content: string; toolCalls: ToolCall[] }
  | { type: 'error'; status: number; message: string };

export async function callTradingAgent(
  messages: TradingAgentMessage[],
  onEvent?: (e: AgentEvent) => void,
): Promise<TradingAgentResponse> {
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

  if (!res.ok || !res.body) {
    let msg = `Trading agent failed (${res.status})`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* noop */ }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let finalContent = '';
  let finalToolCalls: ToolCall[] = [];
  let errorMsg: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      let event = 'message';
      let dataStr = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
      }
      if (!dataStr) continue;
      let data: any;
      try { data = JSON.parse(dataStr); } catch { continue; }

      if (event === 'done') {
        finalContent = data.content || '';
        finalToolCalls = Array.isArray(data.toolCalls) ? data.toolCalls : [];
      } else if (event === 'error') {
        errorMsg = data.message || 'Trading agent failed';
      }
      onEvent?.({ type: event as any, ...data });
    }
  }

  if (errorMsg) throw new Error(errorMsg);
  return { content: finalContent, toolCalls: finalToolCalls };
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
