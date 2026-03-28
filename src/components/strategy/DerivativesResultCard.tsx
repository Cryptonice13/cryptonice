import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, Shield, Zap, BarChart3 } from 'lucide-react';
import { DerivativesAIResult } from '@/hooks/useStrategyBuilder';
import { formatPrice } from '@/lib/format';

interface DerivativesResultCardProps {
  result: DerivativesAIResult;
  assetSymbol: string;
  mode: 'options' | 'futures';
}

export default function DerivativesResultCard({ result, assetSymbol, mode }: DerivativesResultCardProps) {
  const signalIcon = result.signal === 'BUY' ? <TrendingUp className="w-4 h-4" /> : result.signal === 'SELL' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />;
  const signalColor = result.signal === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' : result.signal === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {mode === 'options' ? <TrendingUp className="w-5 h-5 text-primary" /> : <BarChart3 className="w-5 h-5 text-primary" />}
            {result.strategyName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={signalColor}>{signalIcon} {result.signal}</Badge>
            <Badge variant="outline">{assetSymbol.toUpperCase()}</Badge>
            <Badge variant="outline">{result.confidence}% confidence</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricBox icon={<Target className="w-4 h-4 text-primary" />} label="Entry Price" value={formatPrice(result.entryPrice)} />
          <MetricBox icon={<Shield className="w-4 h-4 text-red-400" />} label="Stop Loss" value={formatPrice(result.stopLoss)} />
          <MetricBox icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Max Profit" value={result.maxProfit || 'Unlimited'} />
          <MetricBox icon={<TrendingDown className="w-4 h-4 text-red-400" />} label="Max Loss" value={result.maxLoss || 'N/A'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricBox icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Breakeven" value={formatPrice(result.breakevenPrice)} />
          <MetricBox label="Risk/Reward" value={`${result.riskRewardRatio?.toFixed(2) || 'N/A'}`} />
          <MetricBox label="Win Rate" value={`${result.winRateProbability || 0}%`} />
          <MetricBox label="Position Size" value={`${result.positionSize || 0}%`} />
        </div>

        {/* Options Greeks */}
        {mode === 'options' && result.greeks && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Option Greeks</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricBox label="Delta (Δ)" value={result.greeks.delta?.toFixed(4) || '—'} />
              <MetricBox label="Gamma (Γ)" value={result.greeks.gamma?.toFixed(4) || '—'} />
              <MetricBox label="Theta (Θ)" value={result.greeks.theta?.toFixed(4) || '—'} />
              <MetricBox label="Vega (ν)" value={result.greeks.vega?.toFixed(4) || '—'} />
            </div>
          </div>
        )}

        {/* Futures specifics */}
        {mode === 'futures' && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Futures Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricBox label="Liquidation Price" value={result.liquidationPrice ? formatPrice(result.liquidationPrice) : '—'} />
              <MetricBox label="Leverage" value={result.leverage ? `${result.leverage}x` : '—'} />
              <MetricBox label="Margin Required" value={result.marginRequired || '—'} />
              <MetricBox label="Funding Impact" value={result.fundingRateImpact || '—'} />
            </div>
          </div>
        )}

        {/* Take Profits */}
        {result.takeProfits && result.takeProfits.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Take Profit Targets</h4>
            <div className="flex flex-wrap gap-2">
              {result.takeProfits.map((tp, i) => (
                <Badge key={i} variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  TP{i + 1}: {formatPrice(tp)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {result.reasoning && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-muted-foreground">AI Reasoning</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{result.reasoning}</p>
          </div>
        )}

        {/* Conditions */}
        {result.conditions && result.conditions.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-muted-foreground">Entry Conditions</h4>
            <ul className="space-y-1">
              {result.conditions.map((c, i) => (
                <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBox({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}
