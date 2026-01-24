import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMarketPrediction } from '@/hooks/useCryptoAI';
import { motion } from 'framer-motion';

interface MarketPredictionCardProps {
  symbol: string;
  name: string;
  currentPrice: number;
  logo?: string;
}

export function MarketPredictionCard({ symbol, name, currentPrice, logo }: MarketPredictionCardProps) {
  const { prediction, isLoading, error, getPrediction } = useMarketPrediction();
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleGetPrediction = () => {
    getPrediction(symbol);
    setHasLoaded(true);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'bearish':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
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
        <p className="font-mono font-semibold">${currentPrice.toLocaleString()}</p>
      </div>

      {!hasLoaded ? (
        <Button onClick={handleGetPrediction} className="w-full button-gradient" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Get AI Prediction
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
          <Button variant="outline" size="sm" onClick={handleGetPrediction}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : prediction ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <Badge className={`${getSentimentColor(prediction.sentiment)}`}>
              {getSentimentIcon(prediction.sentiment)}
              <span className="ml-1 capitalize">{prediction.sentiment}</span>
            </Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <div className="flex items-center gap-2">
                <Progress value={prediction.overallConfidence * 10} className="w-16 h-2" />
                <span className="text-sm font-semibold">{prediction.overallConfidence}/10</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Short-term (24h-7d)</p>
              <div className="flex items-center gap-2">
                {prediction.shortTerm?.direction === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : prediction.shortTerm?.direction === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <Minus className="w-4 h-4 text-yellow-400" />
                )}
                <span className="font-semibold capitalize">{prediction.shortTerm?.direction}</span>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Medium-term (1-4w)</p>
              <div className="flex items-center gap-2">
                {prediction.mediumTerm?.direction === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : prediction.mediumTerm?.direction === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <Minus className="w-4 h-4 text-yellow-400" />
                )}
                <span className="font-semibold capitalize">{prediction.mediumTerm?.direction}</span>
              </div>
            </div>
          </div>

          {(prediction.supportLevels?.length > 0 || prediction.resistanceLevels?.length > 0) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Support Levels</p>
                <div className="space-y-1">
                  {prediction.supportLevels?.slice(0, 2).map((level, i) => (
                    <Badge key={i} variant="outline" className="text-green-400 border-green-500/50 mr-1">
                      ${level?.toLocaleString()}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Resistance Levels</p>
                <div className="space-y-1">
                  {prediction.resistanceLevels?.slice(0, 2).map((level, i) => (
                    <Badge key={i} variant="outline" className="text-red-400 border-red-500/50 mr-1">
                      ${level?.toLocaleString()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {prediction.analysis && (
            <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Analysis</p>
              <p className="text-sm line-clamp-3">{prediction.analysis}</p>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleGetPrediction} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Prediction
          </Button>
        </motion.div>
      ) : null}
    </Card>
  );
}
