import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import StrategyForm from '@/components/strategy/StrategyForm';
import StrategyTable from '@/components/strategy/StrategyTable';
import StrategyDetailCard from '@/components/strategy/StrategyDetailCard';
import { useStrategyBuilder, Strategy, StrategyAIResult } from '@/hooks/useStrategyBuilder';
import { useMarketData } from '@/hooks/useMarketData';
import { Cpu } from 'lucide-react';

export default function StrategyBuilder() {
  const { assets } = useMarketData();
  const {
    strategies,
    isGenerating,
    isLoading,
    lastResult,
    generateStrategy,
    fetchStrategies,
    deleteStrategy,
    setLastResult,
  } = useStrategyBuilder();

  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('BTC');

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const handleSelect = (strategy: Strategy) => {
    setSelectedAssetSymbol(strategy.asset_symbol);
    setLastResult({
      strategyName: strategy.strategy_name,
      signal: strategy.signal as 'BUY' | 'SELL' | 'HOLD',
      entryPrice: strategy.entry_price || 0,
      exitPrice: strategy.exit_price || 0,
      stopLoss: strategy.stop_loss || 0,
      takeProfits: strategy.take_profits || [],
      positionSize: strategy.position_size || 0,
      riskRewardRatio: strategy.risk_reward || 0,
      winRateProbability: strategy.win_rate || 0,
      confidence: strategy.confidence || 0,
      conditions: strategy.conditions || [],
      reasoning: strategy.reasoning || '',
      supportLevels: [],
      resistanceLevels: [],
      indicators: { rsi: 50, macdSignal: 'neutral', volumeTrend: 'stable' },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="strategy" />
      <main className="pt-14 pb-20 lg:pb-8 px-3 sm:px-4 max-w-6xl mx-auto space-y-6">
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Strategy Builder</h1>
              <p className="text-sm text-muted-foreground">Generate AI-powered trading strategies with real-time market analysis</p>
            </div>
          </div>
        </div>

        <StrategyForm
          assets={assets}
          isGenerating={isGenerating}
          onGenerate={(params) => {
            setSelectedAssetSymbol(params.assetSymbol);
            generateStrategy(params);
          }}
        />

        {lastResult && (
          <StrategyDetailCard result={lastResult} assetSymbol={selectedAssetSymbol} />
        )}

        <StrategyTable
          strategies={strategies}
          isLoading={isLoading}
          onDelete={deleteStrategy}
          onSelect={handleSelect}
        />
      </main>
      <MobileBottomNav />
    </div>
  );
}
