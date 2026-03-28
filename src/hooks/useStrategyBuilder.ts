import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-ai`;

export interface Strategy {
  id: string;
  user_id: string | null;
  wallet_address: string | null;
  asset_symbol: string;
  asset_id: string;
  strategy_name: string;
  strategy_type: string;
  risk_level: string;
  timeframe: string;
  investment_amount: number;
  signal: string;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profits: number[];
  position_size: number | null;
  risk_reward: number | null;
  win_rate: number | null;
  confidence: number | null;
  conditions: string[];
  reasoning: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StrategyAIResult {
  strategyName: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfits: number[];
  positionSize: number;
  riskRewardRatio: number;
  winRateProbability: number;
  confidence: number;
  conditions: string[];
  reasoning: string;
  supportLevels: number[];
  resistanceLevels: number[];
  indicators: {
    rsi: number;
    macdSignal: string;
    volumeTrend: string;
  };
}

export interface GenerateStrategyParams {
  assetSymbol: string;
  assetId: string;
  strategyType: string;
  riskLevel: string;
  timeframe: string;
  investmentAmount: number;
}

export interface DerivativesStrategyParams {
  mode: 'options' | 'futures';
  assetSymbol: string;
  assetId: string;
  investmentAmount: number;
  riskLevel: string;
  // Options
  contractType?: 'call' | 'put';
  strikePrice?: number;
  expiry?: string;
  premiumBudget?: number;
  optionPreset?: string;
  // Futures
  leverage?: number;
  futuresContract?: string;
  positionDirection?: 'long' | 'short';
  marginType?: 'isolated' | 'cross';
}

export interface DerivativesAIResult {
  strategyName: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];
  positionSize: number;
  riskRewardRatio: number;
  winRateProbability: number;
  confidence: number;
  conditions: string[];
  reasoning: string;
  maxProfit: string;
  maxLoss: string;
  breakevenPrice: number;
  // Options
  greeks?: { delta: number; gamma: number; theta: number; vega: number };
  // Futures
  liquidationPrice?: number;
  leverage?: number;
  marginRequired?: string;
  fundingRateImpact?: string;
}

export function useStrategyBuilder() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<StrategyAIResult | null>(null);
  const [lastDerivativesResult, setLastDerivativesResult] = useState<DerivativesAIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStrategies = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('strategies').select('*').order('created_at', { ascending: false });
      
      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (address) {
        query = query.eq('wallet_address', address).is('user_id', null);
      } else {
        setStrategies([]);
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setStrategies((data || []).map((d: any) => ({
        ...d,
        take_profits: Array.isArray(d.take_profits) ? d.take_profits : [],
        conditions: Array.isArray(d.conditions) ? d.conditions : [],
      })));
    } catch (err) {
      console.error('Failed to fetch strategies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, address]);

  const generateStrategy = useCallback(async (params: GenerateStrategyParams) => {
    setIsGenerating(true);
    setError(null);
    setLastResult(null);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Generate a ${params.strategyType} strategy for ${params.assetSymbol}` }],
          type: 'strategy_builder',
          context: {
            symbol: params.assetSymbol,
            strategyType: params.strategyType,
            riskLevel: params.riskLevel,
            timeframe: params.timeframe,
            investmentAmount: params.investmentAmount,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate strategy');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) throw new Error('No response from AI');

      // Clean potential markdown wrapping
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed: StrategyAIResult = JSON.parse(cleanContent);
      setLastResult(parsed);

      // Save to DB
      const insertData: any = {
        asset_symbol: params.assetSymbol,
        asset_id: params.assetId,
        strategy_name: parsed.strategyName,
        strategy_type: params.strategyType,
        risk_level: params.riskLevel,
        timeframe: params.timeframe,
        investment_amount: params.investmentAmount,
        signal: parsed.signal,
        entry_price: parsed.entryPrice,
        exit_price: parsed.exitPrice,
        stop_loss: parsed.stopLoss,
        take_profits: parsed.takeProfits,
        position_size: parsed.positionSize,
        risk_reward: parsed.riskRewardRatio,
        win_rate: parsed.winRateProbability,
        confidence: parsed.confidence,
        conditions: parsed.conditions,
        reasoning: parsed.reasoning,
        status: 'active',
      };

      if (user?.id) {
        insertData.user_id = user.id;
      } else if (address) {
        insertData.wallet_address = address;
      }

      const { error: insertError } = await supabase.from('strategies').insert(insertData);
      if (insertError) console.error('Failed to save strategy:', insertError);
      else await fetchStrategies();

      toast({ title: 'Strategy Generated', description: `${parsed.signal} signal with ${parsed.confidence}% confidence` });
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate strategy';
      setError(msg);
      toast({ title: 'Generation Failed', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user?.id, address, fetchStrategies, toast]);

  const deleteStrategy = useCallback(async (id: string) => {
    const { error } = await supabase.from('strategies').delete().eq('id', id);
    if (!error) {
      setStrategies(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Strategy Deleted' });
    }
  }, [toast]);

  const updateStrategyStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from('strategies').update({ status }).eq('id', id);
    if (!error) {
      setStrategies(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    }
  }, []);

  return {
    strategies,
    isGenerating,
    isLoading,
    lastResult,
    error,
    generateStrategy,
    fetchStrategies,
    deleteStrategy,
    updateStrategyStatus,
    setLastResult,
  };
}
