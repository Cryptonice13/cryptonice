import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';

interface SavedPrediction {
  id: string;
  asset_symbol: string;
  asset_name: string;
  current_price: number;
  prediction_data: any;
  created_at: string;
}

interface SavedSignal {
  id: string;
  asset_symbol: string;
  asset_name: string;
  current_price: number;
  signal_data: any;
  created_at: string;
}

interface SavedWhaleActivity {
  id: string;
  asset_symbol: string;
  asset_name: string;
  current_price: number;
  whale_data: any;
  created_at: string;
}

interface SavedPortfolioAnalysis {
  id: string;
  health_score: number;
  risk_level: string;
  diversification: string;
  portfolio_snapshot: any;
  analysis_data: any;
  created_at: string;
}

export function useAIInsights() {
  const { user } = useAuth();
  const { address } = useAccount();
  const [predictions, setPredictions] = useState<SavedPrediction[]>([]);
  const [signals, setSignals] = useState<SavedSignal[]>([]);
  const [whaleActivities, setWhaleActivities] = useState<SavedWhaleActivity[]>([]);
  const [portfolioAnalyses, setPortfolioAnalyses] = useState<SavedPortfolioAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const savePrediction = useCallback(async (
    symbol: string, name: string, price: number, data: any
  ) => {
    try {
      await supabase.from('ai_predictions' as any).insert({
        user_id: user?.id || null,
        wallet_address: address || null,
        asset_symbol: symbol,
        asset_name: name,
        current_price: price,
        prediction_data: data,
      });
    } catch (err) {
      console.error('Failed to save prediction:', err);
    }
  }, [user, address]);

  const saveSignal = useCallback(async (
    symbol: string, name: string, price: number, data: any
  ) => {
    try {
      await supabase.from('ai_signals' as any).insert({
        user_id: user?.id || null,
        wallet_address: address || null,
        asset_symbol: symbol,
        asset_name: name,
        current_price: price,
        signal_data: data,
      });
    } catch (err) {
      console.error('Failed to save signal:', err);
    }
  }, [user, address]);

  const saveWhaleActivity = useCallback(async (
    symbol: string, name: string, price: number, data: any
  ) => {
    try {
      await supabase.from('ai_whale_activity' as any).insert({
        user_id: user?.id || null,
        wallet_address: address || null,
        asset_symbol: symbol,
        asset_name: name,
        current_price: price,
        whale_data: data,
      });
    } catch (err) {
      console.error('Failed to save whale activity:', err);
    }
  }, [user, address]);

  const savePortfolioAnalysis = useCallback(async (
    healthScore: number, riskLevel: string, diversification: string, 
    portfolioSnapshot: any, analysisData: any
  ) => {
    try {
      await supabase.from('ai_portfolio_analysis' as any).insert({
        user_id: user?.id || null,
        wallet_address: address || null,
        health_score: healthScore,
        risk_level: riskLevel,
        diversification: diversification,
        portfolio_snapshot: portfolioSnapshot,
        analysis_data: analysisData,
      });
    } catch (err) {
      console.error('Failed to save portfolio analysis:', err);
    }
  }, [user, address]);

  const loadPredictions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('ai_predictions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setPredictions((data as any[]) || []);
    } catch (err) {
      console.error('Failed to load predictions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSignals = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('ai_signals' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setSignals((data as any[]) || []);
    } catch (err) {
      console.error('Failed to load signals:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadWhaleActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('ai_whale_activity' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setWhaleActivities((data as any[]) || []);
    } catch (err) {
      console.error('Failed to load whale activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadPredictions(), loadSignals(), loadWhaleActivities()]);
    setIsLoading(false);
  }, [loadPredictions, loadSignals, loadWhaleActivities]);

  const deletePrediction = useCallback(async (id: string) => {
    await supabase.from('ai_predictions' as any).delete().eq('id', id);
    setPredictions(prev => prev.filter(p => p.id !== id));
  }, []);

  const deleteSignal = useCallback(async (id: string) => {
    await supabase.from('ai_signals' as any).delete().eq('id', id);
    setSignals(prev => prev.filter(s => s.id !== id));
  }, []);

  const deleteWhaleActivity = useCallback(async (id: string) => {
    await supabase.from('ai_whale_activity' as any).delete().eq('id', id);
    setWhaleActivities(prev => prev.filter(w => w.id !== id));
  }, []);

  return {
    predictions, signals, whaleActivities, isLoading,
    savePrediction, saveSignal, saveWhaleActivity,
    loadAll, loadPredictions, loadSignals, loadWhaleActivities,
    deletePrediction, deleteSignal, deleteWhaleActivity,
  };
}
