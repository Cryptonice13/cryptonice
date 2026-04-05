import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import StrategyForm from '@/components/strategy/StrategyForm';
import StrategyTable from '@/components/strategy/StrategyTable';
import StrategyDetailCard from '@/components/strategy/StrategyDetailCard';
import { useStrategyBuilder, Strategy, StrategyAIResult } from '@/hooks/useStrategyBuilder';
import { useMarketData } from '@/hooks/useMarketData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cpu, TrendingUp, BarChart3 } from 'lucide-react';

export default function StrategyBuilder() {
  const { assets } = useMarketData();
  const {
    strategies,
    isGenerating,
    isLoading,
    lastResult,
    lastDerivativesResult,
    generateStrategy,
    generateDerivativesStrategy,
    fetchStrategies,
    deleteStrategy,
    setLastResult,
    setLastDerivativesResult,
  } = useStrategyBuilder();

  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('BTC');
  const [derivativesAssetSymbol, setDerivativesAssetSymbol] = useState('BTC');
  const [derivativesMode, setDerivativesMode] = useState<'options' | 'futures'>('options');

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

        <Tabs defaultValue="spot" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="spot" className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> Spot
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-1.5" onClick={() => setDerivativesMode('options')}>
              <TrendingUp className="w-4 h-4" /> Options
            </TabsTrigger>
            <TabsTrigger value="futures" className="flex items-center gap-1.5" onClick={() => setDerivativesMode('futures')}>
              <BarChart3 className="w-4 h-4" /> Futures
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spot" className="space-y-6 mt-4">
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
          </TabsContent>

          <TabsContent value="options" className="space-y-6 mt-4">
            <DerivativesStrategyForm
              mode="options"
              assets={assets}
              isGenerating={isGenerating}
              onGenerate={(params) => {
                setDerivativesAssetSymbol(params.assetSymbol);
                setDerivativesMode('options');
                generateDerivativesStrategy(params);
              }}
            />
            {lastDerivativesResult && derivativesMode === 'options' && (
              <DerivativesResultCard result={lastDerivativesResult} assetSymbol={derivativesAssetSymbol} mode="options" />
            )}
          </TabsContent>

          <TabsContent value="futures" className="space-y-6 mt-4">
            <DerivativesStrategyForm
              mode="futures"
              assets={assets}
              isGenerating={isGenerating}
              onGenerate={(params) => {
                setDerivativesAssetSymbol(params.assetSymbol);
                setDerivativesMode('futures');
                generateDerivativesStrategy(params);
              }}
            />
            {lastDerivativesResult && derivativesMode === 'futures' && (
              <DerivativesResultCard result={lastDerivativesResult} assetSymbol={derivativesAssetSymbol} mode="futures" />
            )}
          </TabsContent>
        </Tabs>
      </main>
      <MobileBottomNav />
    </div>
  );
}