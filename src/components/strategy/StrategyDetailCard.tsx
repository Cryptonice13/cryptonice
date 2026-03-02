import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Shield, TrendingUp, TrendingDown, Activity, Brain, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StrategyAIResult } from '@/hooks/useStrategyBuilder';

interface StrategyDetailCardProps {
  result: StrategyAIResult;
  assetSymbol: string;
}

export default function StrategyDetailCard({ result, assetSymbol }: StrategyDetailCardProps) {
  const signalColor = result.signal === 'BUY' ? 'text-green-400' : result.signal === 'SELL' ? 'text-red-400' : 'text-yellow-400';
  const signalBg = result.signal === 'BUY' ? 'bg-green-500/10 border-green-500/30' : result.signal === 'SELL' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30';

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Signal Banner */}
      <Card className={`border ${signalBg}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{result.strategyName}</p>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-bold ${signalColor}`}>{result.signal}</span>
                <Badge variant="outline" className="text-xs">
                  {assetSymbol}
                </Badge>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold text-primary">{result.confidence}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{result.winRateProbability}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">R:R</p>
                <p className="text-2xl font-bold">{result.riskRewardRatio.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price Levels */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Price Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Entry Price</span>
              <span className="font-mono font-semibold">${result.entryPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Exit Target</span>
              <span className="font-mono font-semibold text-green-400">${result.exitPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stop Loss</span>
              <span className="font-mono font-semibold text-red-400">${result.stopLoss.toLocaleString()}</span>
            </div>
            <div className="border-t border-border/50 pt-2">
              <p className="text-xs text-muted-foreground mb-2">Take Profits</p>
              {result.takeProfits.map((tp, i) => (
                <div key={i} className="flex justify-between items-center py-0.5">
                  <span className="text-xs text-muted-foreground">TP {i + 1}</span>
                  <span className="font-mono text-sm text-green-400">${tp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk & Position */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Risk & Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">AI Confidence</span>
                <span>{result.confidence}%</span>
              </div>
              <Progress value={result.confidence} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Win Probability</span>
                <span>{result.winRateProbability}%</span>
              </div>
              <Progress value={result.winRateProbability} className="h-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Position Size</span>
              <span className="font-semibold">{result.positionSize}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Risk/Reward</span>
              <span className="font-semibold">{result.riskRewardRatio.toFixed(2)}</span>
            </div>
            {result.indicators && (
              <div className="border-t border-border/50 pt-2 space-y-1">
                <p className="text-xs text-muted-foreground mb-1">Indicators</p>
                <div className="flex justify-between text-xs">
                  <span>RSI</span>
                  <span className={result.indicators.rsi > 70 ? 'text-red-400' : result.indicators.rsi < 30 ? 'text-green-400' : ''}>{result.indicators.rsi}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>MACD</span>
                  <span className={result.indicators.macdSignal === 'bullish' ? 'text-green-400' : result.indicators.macdSignal === 'bearish' ? 'text-red-400' : ''}>{result.indicators.macdSignal}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Volume</span>
                  <span>{result.indicators.volumeTrend}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conditions & Reasoning */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.conditions?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Entry Conditions</p>
              <ul className="space-y-1">
                {result.conditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Activity className="w-3 h-3 mt-1 text-primary shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.reasoning && (
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground mb-1">Reasoning</p>
              <p className="text-sm leading-relaxed">{result.reasoning}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Support Levels</p>
              {result.supportLevels?.map((l, i) => (
                <div key={i} className="flex items-center gap-1 text-sm text-green-400">
                  <ArrowDownRight className="w-3 h-3" />${l.toLocaleString()}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Resistance Levels</p>
              {result.resistanceLevels?.map((l, i) => (
                <div key={i} className="flex items-center gap-1 text-sm text-red-400">
                  <ArrowUpRight className="w-3 h-3" />${l.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
