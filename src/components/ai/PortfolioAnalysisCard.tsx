import { PieChart, Shield, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePortfolioAnalysis } from '@/hooks/useCryptoAI';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface PortfolioAnalysisCardProps {
  portfolio: { asset: { symbol: string; name: string; price: number }; amount: number; avgBuyPrice: number }[];
  onAnalyze?: () => void;
  onSave?: (analysis: any, portfolio: any[]) => void;
}

export function PortfolioAnalysisCard({ portfolio, onSave }: PortfolioAnalysisCardProps) {
  const { analysis, isLoading, error, analyzePortfolio } = usePortfolioAnalysis();
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [concernsOpen, setConcernsOpen] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  const handleAnalyze = () => {
    setHasSaved(false);
    analyzePortfolio(portfolio);
  };

  // Auto-save when analysis completes
  React.useEffect(() => {
    if (analysis && !hasSaved && onSave) {
      onSave(analysis, portfolio);
      setHasSaved(true);
    }
  }, [analysis, hasSaved, onSave, portfolio]);

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">High Risk</Badge>;
      default:
        return <Badge variant="secondary">{risk}</Badge>;
    }
  };

  const getDiversificationBadge = (div: string) => {
    const lower = div?.toLowerCase();
    if (lower?.includes('very low') || lower?.includes('none'))
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Very Low</Badge>;
    if (lower?.includes('low'))
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Low</Badge>;
    if (lower?.includes('medium') || lower?.includes('moderate'))
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Moderate</Badge>;
    if (lower?.includes('high') || lower?.includes('good'))
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">High</Badge>;
    return <Badge variant="secondary">{div}</Badge>;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthStroke = (score: number) => {
    if (score >= 80) return 'stroke-green-400';
    if (score >= 60) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  if (portfolio.length === 0) {
    return (
      <Card className="glass-card p-8 text-center">
        <PieChart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No Portfolio Data</h3>
        <p className="text-sm text-muted-foreground">
          Add assets to your portfolio to get AI-powered analysis.
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">AI Portfolio Analysis</h3>
            <p className="text-xs text-muted-foreground">{portfolio.length} asset{portfolio.length !== 1 ? 's' : ''} tracked</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isLoading} className="gap-1.5">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{analysis ? 'Re-analyze' : 'Analyze'}</span>
        </Button>
      </div>

      <div className="p-5">
        {/* Initial CTA */}
        {!analysis && !isLoading && !error && (
          <Button onClick={handleAnalyze} className="w-full button-gradient h-12 text-base">
            <Shield className="w-5 h-5 mr-2" />
            Analyze My Portfolio
          </Button>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Analyzing your portfolio with AI...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-6">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={handleAnalyze}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {analysis && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* Top Row: Health Score + Risk + Diversification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Health Score */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/20 border border-border/30">
                  <div className="relative w-24 h-24 mb-2">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none" strokeWidth="6" className="stroke-muted/40" />
                      <circle
                        cx="48" cy="48" r="40" fill="none" strokeWidth="6"
                        strokeDasharray={`${analysis.healthScore * 2.51} 251`}
                        strokeLinecap="round"
                        className={getHealthStroke(analysis.healthScore)}
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${getHealthColor(analysis.healthScore)}`}>
                      {analysis.healthScore}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Health Score</p>
                </div>

                {/* Risk Level */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/20 border border-border/30 gap-2">
                  <AlertTriangle className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium">Risk Level</p>
                  {getRiskBadge(analysis.riskLevel)}
                </div>

                {/* Diversification */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/20 border border-border/30 gap-2">
                  <PieChart className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium">Diversification</p>
                  {getDiversificationBadge(analysis.diversification)}
                </div>
              </div>

              {/* Suggestions */}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold">Suggestions</span>
                      <Badge variant="secondary" className="text-[10px] h-5">{analysis.suggestions.length}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${suggestionsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 space-y-2">
                      {analysis.suggestions.map((suggestion, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border-l-2 border-green-500/40"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm leading-relaxed">{suggestion}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Concerns */}
              {analysis.concerns && analysis.concerns.length > 0 && (
                <Collapsible open={concernsOpen} onOpenChange={setConcernsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-semibold">Concerns</span>
                      <Badge variant="secondary" className="text-[10px] h-5">{analysis.concerns.length}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${concernsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 space-y-2">
                      {analysis.concerns.map((concern, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border-l-2 border-yellow-500/40"
                        >
                          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm leading-relaxed">{concern}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Summary */}
              {analysis.summary && (
                <div className="p-4 rounded-xl bg-muted/10 border border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</p>
                  <p className="text-sm leading-relaxed">{analysis.summary}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
