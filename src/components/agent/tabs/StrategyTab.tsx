import { useEffect } from 'react';
import StrategyForm from '@/components/strategy/StrategyForm';
import StrategyTable from '@/components/strategy/StrategyTable';
import StrategyDetailCard from '@/components/strategy/StrategyDetailCard';
import { useStrategyBuilder } from '@/hooks/useStrategyBuilder';
import { useMarketData } from '@/hooks/useMarketData';

interface Props {
  onResult?: (markdown: string) => void;
  defaultAssetSymbol?: string;
}

function resultToMarkdown(symbol: string, r: any): string {
  return `## 📊 Strategy: ${r.strategyName} (${symbol})
**Signal:** ${r.signal}  ·  **Confidence:** ${r.confidence}%
- Entry: ${r.entryPrice}
- Stop loss: ${r.stopLoss}
- Take profits: ${(r.takeProfits || []).join(', ')}
- Position size: ${r.positionSize}
- Risk/Reward: ${r.riskRewardRatio}  ·  Win-rate: ${r.winRateProbability}%

${r.reasoning || ''}`;
}

export default function StrategyTab({ onResult, defaultAssetSymbol }: Props) {
  const { assets } = useMarketData();
  const { strategies, isGenerating, isLoading, lastResult, generateStrategy, fetchStrategies, deleteStrategy } =
    useStrategyBuilder();

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  useEffect(() => {
    if (lastResult && onResult) {
      onResult(resultToMarkdown(defaultAssetSymbol || lastResult.strategyName, lastResult));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult]);

  return (
    <div className="space-y-4">
      <StrategyForm assets={assets} isGenerating={isGenerating} onGenerate={generateStrategy} />
      {lastResult && <StrategyDetailCard result={lastResult} assetSymbol={defaultAssetSymbol || 'BTC'} />}
      <StrategyTable strategies={strategies} isLoading={isLoading} onDelete={deleteStrategy} onSelect={() => {}} />
    </div>
  );
}
