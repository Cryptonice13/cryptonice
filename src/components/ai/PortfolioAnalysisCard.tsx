import { useEffect } from 'react';
import { PieChart, Shield, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePortfolioAnalysis } from '@/hooks/useCryptoAI';
import { motion } from 'framer-motion';

interface PortfolioAnalysisCardProps {
  portfolio: { asset: { symbol: string; name: string; price: number }; amount: number; avgBuyPrice: number }[];
  onAnalyze?: () => void;
}

export function PortfolioAnalysisCard({ portfolio }: PortfolioAnalysisCardProps) {
  const { analysis, isLoading, error, analyzePortfolio } = usePortfolioAnalysis();

  const handleAnalyze = () => {
    analyzePortfolio(portfolio);
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'high':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (portfolio.length === 0) {
    return (
      <Card className="glass-card p-6 text-center">
        <PieChart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No Portfolio Data</h3>
        <p className="text-sm text-muted-foreground">
          Add assets to your portfolio to get AI-powered analysis.
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Portfolio Analysis</h3>
            <p className="text-xs text-muted-foreground">{portfolio.length} assets</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!analysis && !isLoading && !error && (
        <Button onClick={handleAnalyze} className="w-full button-gradient">
          <Shield className="w-4 h-4 mr-2" />
          Analyze Portfolio
        </Button>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Analyzing your portfolio...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={handleAnalyze}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {analysis && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Health Score */}
          <div className="text-center py-4">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${analysis.healthScore * 2.51} 251`}
                  strokeLinecap="round"
                  className={getHealthColor(analysis.healthScore)}
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <span className={`absolute text-2xl font-bold ${getHealthColor(analysis.healthScore)}`}>
                {analysis.healthScore}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Portfolio Health Score</p>
          </div>

          {/* Risk Level */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm">Risk Level</span>
            <Badge className={getRiskColor(analysis.riskLevel)}>
              {analysis.riskLevel?.toUpperCase()}
            </Badge>
          </div>

          {/* Diversification */}
          {analysis.diversification && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Diversification</p>
              <p className="text-sm">{analysis.diversification}</p>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Suggestions
              </p>
              {analysis.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Concerns */}
          {analysis.concerns && analysis.concerns.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Concerns
              </p>
              {analysis.concerns.map((concern, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{concern}</p>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {analysis.summary && (
            <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Summary</p>
              <p className="text-sm">{analysis.summary}</p>
            </div>
          )}
        </motion.div>
      )}
    </Card>
  );
}
