import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { invokeCryptoAI, readCryptoAIError } from '@/lib/cryptoAIClient';


function extractJSON(raw: string): string {
  let str = raw.trim();
  const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) str = fenceMatch[1].trim();
  return str;
}

export interface TechnicalAnalysis {
  indicators: {
    rsi: { value: number; signal: string; description: string };
    macd: { value: number; signal: string; histogram: number; description: string };
    bollingerBands: { upper: number; middle: number; lower: number; position: string; description: string };
    movingAverages: { sma20: number; sma50: number; sma200: number; ema12: number; ema26: number; crossover: string; trend: string; description: string };
  };
  supportResistance: {
    supports: { price: number; strength: string }[];
    resistances: { price: number; strength: string }[];
  };
  volumeAnalysis: { trend: string; averageVolume: number; currentVolume: number; volumeRatio: number; description: string };
  trendAnalysis: { direction: string; strength: number; timeframe: string; description: string };
  chartPatterns: { pattern: string; type: string; significance: string }[];
  verdict: { signal: string; confidence: number; reasoning: string; keyLevels: { entry: number; stopLoss: number; target: number } };
}

export interface FundamentalAnalysis {
  overallScore: number;
  tokenomics: { circulatingSupply: string; maxSupply: string; inflationRate: string; distribution: string; score: number; description: string };
  marketPosition: { rank: number; dominance: string; competitors: string[]; moat: string; score: number; description: string };
  ecosystem: { partnerships: string[]; dapps: number; developers: string; activity: string; score: number; description: string };
  catalysts: { event: string; impact: string; timeframe: string }[];
  risks: { factor: string; severity: string; likelihood: string }[];
  assessment: { thesis: string; outlook: string; summary: string };
}

export function useAnalysis() {
  const [technicalData, setTechnicalData] = useState<TechnicalAnalysis | null>(null);
  const [fundamentalData, setFundamentalData] = useState<FundamentalAnalysis | null>(null);
  const [isLoadingTechnical, setIsLoadingTechnical] = useState(false);
  const [isLoadingFundamental, setIsLoadingFundamental] = useState(false);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const { user } = useAuth();
  const { address } = useAccount();
  const currentAssetIdRef = useRef<string>('');

  const runAnalysis = useCallback(async (
    type: 'technical_analysis' | 'fundamental_analysis',
    symbol: string,
    assetName: string,
    currentPrice: number,
    assetId: string
  ) => {
    const setLoading = type === 'technical_analysis' ? setIsLoadingTechnical : setIsLoadingFundamental;
    setLoading(true);
    setError(null);
    setSelectedHistoryId(null);

    try {
      const response = await invokeCryptoAI({
        type,
        messages: [{ role: 'user', content: `${type === 'technical_analysis' ? 'Technical' : 'Fundamental'} analysis for ${symbol}` }],
        context: { symbol },
        walletAddress: address,
      });

      if (!response.ok) {
        const msg = await readCryptoAIError(response);
        throw new Error(msg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        const parsed = JSON.parse(extractJSON(content));

        if (type === 'technical_analysis') {
          setTechnicalData(parsed);
        } else {
          setFundamentalData(parsed);
        }

        // Save to database
        const insertData: any = {
          asset_id: assetId,
          asset_symbol: symbol,
          asset_name: assetName,
          current_price: currentPrice,
          analysis_type: type === 'technical_analysis' ? 'technical' : 'fundamental',
          analysis_data: parsed,
        };

        if (user?.id) {
          insertData.user_id = user.id;
        } else if (address) {
          insertData.wallet_address = address;
        }

        if (user?.id || address) {
          await supabase.from('ai_analysis' as any).insert(insertData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user, address]);

  const loadLatestForAsset = useCallback(async (assetId: string) => {
    if (!user?.id && !address) return;
    if (currentAssetIdRef.current === assetId && (technicalData || fundamentalData)) return;
    
    currentAssetIdRef.current = assetId;
    setIsLoadingLatest(true);
    setTechnicalData(null);
    setFundamentalData(null);
    setSelectedHistoryId(null);

    try {
      let query = (supabase.from('ai_analysis' as any) as any)
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (address) {
        query = query.eq('wallet_address', address);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        const latestTech = data.find((d: any) => d.analysis_type === 'technical');
        const latestFund = data.find((d: any) => d.analysis_type === 'fundamental');
        if (latestTech) setTechnicalData(latestTech.analysis_data as TechnicalAnalysis);
        if (latestFund) setFundamentalData(latestFund.analysis_data as FundamentalAnalysis);
      }
    } catch (err) {
      console.error('Failed to load latest analysis:', err);
    } finally {
      setIsLoadingLatest(false);
    }
  }, [user, address]);

  const forceLoadLatest = useCallback(async (assetId: string) => {
    currentAssetIdRef.current = '';
    await loadLatestForAsset(assetId);
  }, [loadLatestForAsset]);

  const selectHistoryItem = useCallback((item: any) => {
    setSelectedHistoryId(item.id);
    if (item.analysis_type === 'technical') {
      setTechnicalData(item.analysis_data as TechnicalAnalysis);
    } else {
      setFundamentalData(item.analysis_data as FundamentalAnalysis);
    }
  }, []);

  const loadHistory = useCallback(async (assetId: string) => {
    if (!user?.id && !address) return [];
    
    let query = (supabase.from('ai_analysis' as any) as any).select('*').eq('asset_id', assetId).order('created_at', { ascending: false }).limit(10);
    
    if (user?.id) {
      query = query.eq('user_id', user.id);
    } else if (address) {
      query = query.eq('wallet_address', address);
    }

    const { data } = await query;
    return data || [];
  }, [user, address]);

  return {
    technicalData,
    fundamentalData,
    isLoadingTechnical,
    isLoadingFundamental,
    isLoadingLatest,
    error,
    selectedHistoryId,
    runAnalysis,
    loadLatestForAsset,
    forceLoadLatest,
    selectHistoryItem,
    loadHistory,
  };
}
