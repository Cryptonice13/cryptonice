import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Target, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMarketPrediction } from '@/hooks/useCryptoAI';
import { motion } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MarketPredictionCardProps {
  symbol: string;
  name: string;
  currentPrice: number;
  logo?: string;
  onSave?: (symbol: string, name: string, price: number, data: any) => void;
}

/** Safely format a value that may be a number or string like "$66,200" */
function formatPrice(v: any): string {
  if (typeof v === 'number') return `$${v.toLocaleString()}`;
  if (typeof v === 'string') {
    if (v.startsWith('$')) return v;
    return `$${v}`;
  }
  return '$0';
}

function formatConfidence(v: any): string {
  if (typeof v === 'string') return v.includes('%') ? v : `${v}%`;
  if (typeof v === 'number') return v > 1 ? `${v}%` : `${(v * 100).toFixed(0)}%`;
  return '0%';
}

function confidenceToNum(v: any): number {
  if (typeof v === 'number') return v > 1 ? v : v * 100;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace('%', ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function overallConfToNum(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[/%]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export function MarketPredictionCard({ symbol, name, currentPrice, logo }: MarketPredictionCardProps) {
  const { prediction, isLoading, error, getPrediction } = useMarketPrediction();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(true);

  const handleGetPrediction = () => {
    getPrediction(symbol);
    setHasLoaded(true);
  };

  const getSentimentColor = (sentiment: string) => {
    const s = sentiment?.toLowerCase();
    if (s?.includes('bullish')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (s?.includes('bearish')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  const getSentimentIcon = (sentiment: string) => {
    const s = sentiment?.toLowerCase();
    if (s?.includes('bullish')) return <TrendingUp className="w-4 h-4" />;
    if (s?.includes('bearish')) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getDirectionIcon = (dir: string) => {
    const d = dir?.toLowerCase();
    if (d?.includes('bull') || d?.includes('up')) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (d?.includes('bear') || d?.includes('down')) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <Card className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          {logo && <img src={logo} alt={name} className="w-8 h-8 rounded-full" />}
          <div>
            <h3 className="font-semibold text-sm">{symbol} Prediction</h3>
            <p className="text-xs text-muted-foreground font-mono">${currentPrice.toLocaleString()}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleGetPrediction} disabled={isLoading} className="gap-1.5 h-8">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <div className="p-4">
        {!hasLoaded ? (
          <Button onClick={handleGetPrediction} className="w-full button-gradient" disabled={isLoading}>
            <Target className="w-4 h-4 mr-2" />
            Get AI Prediction
          </Button>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-xs text-muted-foreground">Analyzing market data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={handleGetPrediction}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : prediction ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Sentiment + Confidence Row */}
            <div className="flex items-center justify-between">
              <Badge className={getSentimentColor(prediction.sentiment)}>
                {getSentimentIcon(prediction.sentiment)}
                <span className="ml-1.5 capitalize">{prediction.sentiment}</span>
              </Badge>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Confidence</p>
                <div className="flex items-center gap-2">
                  <Progress value={overallConfToNum(prediction.overallConfidence) * 10} className="w-14 h-1.5" />
                  <span className="text-xs font-bold">{overallConfToNum(prediction.overallConfidence)}/10</span>
                </div>
              </div>
            </div>

            {/* Short + Medium Term */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/20 border border-border/30 p-3 space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Short-term</p>
                <div className="flex items-center gap-1.5">
                  {getDirectionIcon(prediction.shortTerm?.direction)}
                  <span className="text-sm font-semibold capitalize">{prediction.shortTerm?.direction}</span>
                </div>
                {prediction.shortTerm?.target != null && prediction.shortTerm.target !== 0 && (
                  <p className="text-xs text-muted-foreground">Target: <span className="font-mono text-foreground">{formatPrice(prediction.shortTerm.target)}</span></p>
                )}
                {prediction.shortTerm?.confidence != null && (
                  <p className="text-xs text-muted-foreground">Conf: <span className="font-mono text-foreground">{formatConfidence(prediction.shortTerm.confidence)}</span></p>
                )}
              </div>
              <div className="rounded-lg bg-muted/20 border border-border/30 p-3 space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Medium-term</p>
                <div className="flex items-center gap-1.5">
                  {getDirectionIcon(prediction.mediumTerm?.direction)}
                  <span className="text-sm font-semibold capitalize">{prediction.mediumTerm?.direction}</span>
                </div>
                {prediction.mediumTerm?.target != null && prediction.mediumTerm.target !== 0 && (
                  <p className="text-xs text-muted-foreground">Target: <span className="font-mono text-foreground">{formatPrice(prediction.mediumTerm.target)}</span></p>
                )}
                {prediction.mediumTerm?.confidence != null && (
                  <p className="text-xs text-muted-foreground">Conf: <span className="font-mono text-foreground">{formatConfidence(prediction.mediumTerm.confidence)}</span></p>
                )}
              </div>
            </div>

            {/* Support / Resistance */}
            {((prediction.supportLevels?.length ?? 0) > 0 || (prediction.resistanceLevels?.length ?? 0) > 0) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Support</p>
                  <div className="flex flex-wrap gap-1">
                    {prediction.supportLevels?.slice(0, 3).map((level, i) => (
                      <Badge key={i} variant="outline" className="text-green-400 border-green-500/30 text-[10px]">
                        {formatPrice(level)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Resistance</p>
                  <div className="flex flex-wrap gap-1">
                    {prediction.resistanceLevels?.slice(0, 3).map((level, i) => (
                      <Badge key={i} variant="outline" className="text-red-400 border-red-500/30 text-[10px]">
                        {formatPrice(level)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis */}
            {prediction.analysis && (
              <Collapsible open={analysisOpen} onOpenChange={setAnalysisOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold">Analysis</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${analysisOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 rounded-lg bg-muted/10 border border-border/30">
                    <p className="text-sm leading-relaxed">{prediction.analysis}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </motion.div>
        ) : null}
      </div>
    </Card>
  );
}
