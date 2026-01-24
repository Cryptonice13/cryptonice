import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTradingSignal } from '@/hooks/useCryptoAI';
import { motion } from 'framer-motion';

interface TradingSignalCardProps {
  symbol: string;
  name: string;
  price: number;
  logo?: string;
}

export function TradingSignalCard({ symbol, name, price, logo }: TradingSignalCardProps) {
  const { signal, isLoading, error, getSignal } = useTradingSignal();
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleGetSignal = () => {
    getSignal(symbol, price);
    setHasLoaded(true);
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'SELL':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY':
        return <TrendingUp className="w-5 h-5" />;
      case 'SELL':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  return (
    <Card className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logo && (
            <img src={logo} alt={name} className="w-10 h-10 rounded-full" />
          )}
          <div>
            <h3 className="font-semibold">{symbol}</h3>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold">${price.toLocaleString()}</p>
        </div>
      </div>

      {!hasLoaded ? (
        <Button onClick={handleGetSignal} className="w-full button-gradient" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Get AI Signal
            </>
          )}
        </Button>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={handleGetSignal}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : signal ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <Badge className={`${getSignalColor(signal.signal)} text-lg px-4 py-2`}>
              {getSignalIcon(signal.signal)}
              <span className="ml-2 font-bold">{signal.signal}</span>
            </Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Strength</p>
              <p className="font-bold text-lg">{signal.strength}/10</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Entry Range</p>
              <p className="font-mono">
                ${signal.entryRange?.min?.toLocaleString()} - ${signal.entryRange?.max?.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Stop Loss</p>
              <p className="font-mono text-red-400">
                ${signal.stopLoss?.toLocaleString()}
              </p>
            </div>
          </div>

          {signal.takeProfits && signal.takeProfits.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-2">Take Profit Targets</p>
              <div className="flex gap-2">
                {signal.takeProfits.map((tp, i) => (
                  <Badge key={i} variant="outline" className="text-green-400 border-green-500/50">
                    TP{i + 1}: ${tp?.toLocaleString()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Risk/Reward:</span>
              <span className="ml-2 font-semibold">{signal.riskReward}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Timeframe:</span>
              <span className="ml-2 font-semibold">{signal.timeframe}</span>
            </div>
          </div>

          {signal.reasoning && (
            <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Analysis</p>
              <p className="text-sm">{signal.reasoning}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3" />
            <span>AI signals are for informational purposes only. Not financial advice.</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleGetSignal} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Signal
          </Button>
        </motion.div>
      ) : null}
    </Card>
  );
}
