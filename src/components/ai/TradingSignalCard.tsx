import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTradingSignal } from '@/hooks/useCryptoAI';
import { motion } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TradingSignalCardProps {
  symbol: string;
  name: string;
  price: number;
  logo?: string;
  onSave?: (symbol: string, name: string, price: number, data: any) => void;
}

function formatVal(v: any): string {
  if (typeof v === 'number') return `$${v.toLocaleString()}`;
  if (typeof v === 'string') {
    if (v.startsWith('$')) return v;
    return `$${v}`;
  }
  return '$0';
}

function toNum(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[$,%\s]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export function TradingSignalCard({ symbol, name, price, logo, onSave }: TradingSignalCardProps) {
  const { signal, isLoading, error, getSignal } = useTradingSignal();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(true);

  const handleGetSignal = () => {
    getSignal(symbol, price);
    setHasLoaded(true);
  };

  // Auto-save when signal arrives
  const prevSigRef = useState<any>(null);
  if (signal && signal !== prevSigRef[0]) {
    prevSigRef[0] = signal;
    onSave?.(symbol, name, price, signal);
  }

  const getSignalStyle = (s: string) => {
    switch (s) {
      case 'BUY': return { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-400', icon: <TrendingUp className="w-5 h-5" /> };
      case 'SELL': return { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', icon: <TrendingDown className="w-5 h-5" /> };
      default: return { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400', icon: <Minus className="w-5 h-5" /> };
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          {logo && <img src={logo} alt={name} className="w-8 h-8 rounded-full" />}
          <div>
            <h3 className="font-semibold text-sm">{symbol} Signal</h3>
            <p className="text-xs text-muted-foreground font-mono">${price.toLocaleString()}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleGetSignal} disabled={isLoading} className="gap-1.5 h-8">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <div className="p-4">
        {!hasLoaded ? (
          <Button onClick={handleGetSignal} className="w-full button-gradient" disabled={isLoading}>
            <Target className="w-4 h-4 mr-2" />
            Get AI Signal
          </Button>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-xs text-muted-foreground">Generating trading signal...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={handleGetSignal}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : signal ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Signal Badge + Strength */}
            {(() => {
              const style = getSignalStyle(signal.signal);
              return (
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${style.bg}`}>
                    {style.icon}
                    <span className={`font-bold text-lg ${style.text}`}>{signal.signal}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Strength</p>
                    <p className="font-bold text-xl">{toNum(signal.strength)}<span className="text-sm text-muted-foreground">/10</span></p>
                  </div>
                </div>
              );
            })()}

            {/* Entry / Stop Loss */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/20 border border-border/30 p-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Entry Range</p>
                <p className="font-mono text-sm">
                  {formatVal(signal.entryRange?.min)} – {formatVal(signal.entryRange?.max)}
                </p>
              </div>
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Stop Loss</p>
                <p className="font-mono text-sm text-red-400">{formatVal(signal.stopLoss)}</p>
              </div>
            </div>

            {/* Take Profits */}
            {signal.takeProfits && signal.takeProfits.length > 0 && (
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Take Profit Targets</p>
                <div className="flex flex-wrap gap-1.5">
                  {signal.takeProfits.map((tp, i) => (
                    <Badge key={i} variant="outline" className="text-green-400 border-green-500/30 text-xs font-mono">
                      TP{i + 1}: {formatVal(tp)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risk/Reward + Timeframe */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div>
                <p className="text-[10px] text-muted-foreground">Risk/Reward</p>
                <p className="text-sm font-semibold">{signal.riskReward}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Timeframe</p>
                <p className="text-sm font-semibold">{signal.timeframe}</p>
              </div>
            </div>

            {/* Reasoning */}
            {signal.reasoning && (
              <Collapsible open={reasoningOpen} onOpenChange={setReasoningOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold">Analysis</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${reasoningOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 rounded-lg bg-muted/10 border border-border/30">
                    <p className="text-sm leading-relaxed">{signal.reasoning}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Disclaimer */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>AI signals are for informational purposes only. Not financial advice.</span>
            </div>
          </motion.div>
        ) : null}
      </div>
    </Card>
  );
}
