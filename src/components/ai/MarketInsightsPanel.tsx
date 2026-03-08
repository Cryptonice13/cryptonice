import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  Target,
  Zap,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FearGreedGauge } from './FearGreedGauge';
import { useAnalysis, type TechnicalAnalysis, type FundamentalAnalysis } from '@/hooks/useAnalysis';
import type { CryptoAsset } from '@/hooks/useMarketData';

interface MarketInsightsPanelProps {
  assets: CryptoAsset[];
}

function getSignalColor(signal: string) {
  const s = signal?.toLowerCase() || '';
  if (s.includes('buy') || s.includes('bullish') || s.includes('strong')) return 'text-green-400';
  if (s.includes('sell') || s.includes('bearish')) return 'text-red-400';
  return 'text-yellow-400';
}

function getSignalBg(signal: string) {
  const s = signal?.toLowerCase() || '';
  if (s.includes('buy') || s.includes('bullish') || s.includes('strong')) return 'bg-green-500/15 text-green-400 border-green-500/30';
  if (s.includes('sell') || s.includes('bearish')) return 'bg-red-500/15 text-red-400 border-red-500/30';
  return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
}

function getScoreColor(score: number) {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getSeverityColor(severity: string) {
  const s = severity?.toLowerCase() || '';
  if (s.includes('high') || s.includes('critical')) return 'bg-red-500/15 text-red-400 border-red-500/30';
  if (s.includes('medium') || s.includes('moderate')) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  return 'bg-green-500/15 text-green-400 border-green-500/30';
}

/* ─── Asset Selector ─── */
function AssetSelector({
  assets,
  selectedId,
  onSelect,
}: {
  assets: CryptoAsset[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger className="h-9 text-sm">
        <SelectValue placeholder="Select asset…" />
      </SelectTrigger>
      <SelectContent>
        {assets.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            <span className="flex items-center gap-2">
              <img src={a.logo} alt={a.name} className="w-4 h-4 rounded-full" />
              {a.symbol} — ${a.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ─── Technical Overview ─── */
function TechnicalOverview({ data }: { data: TechnicalAnalysis }) {
  const { indicators, trendAnalysis, verdict } = data;

  return (
    <div className="space-y-3">
      {/* Indicators row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">RSI</p>
          <p className="text-lg font-bold font-mono">{indicators.rsi.value}</p>
          <Badge variant="outline" className={`text-[10px] mt-1 ${getSignalBg(indicators.rsi.signal)}`}>
            {indicators.rsi.signal}
          </Badge>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">MACD</p>
          <p className="text-lg font-bold font-mono">{indicators.macd.value?.toFixed?.(2) ?? '—'}</p>
          <Badge variant="outline" className={`text-[10px] mt-1 ${getSignalBg(indicators.macd.signal)}`}>
            {indicators.macd.signal}
          </Badge>
        </div>
      </div>

      {/* Trend */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {trendAnalysis.direction?.toLowerCase().includes('up') ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : trendAnalysis.direction?.toLowerCase().includes('down') ? (
            <TrendingDown className="w-4 h-4 text-red-400" />
          ) : (
            <Activity className="w-4 h-4 text-yellow-400" />
          )}
          <div>
            <p className="text-xs font-medium">Trend: {trendAnalysis.direction}</p>
            <p className="text-[10px] text-muted-foreground">Strength {trendAnalysis.strength}%</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">{trendAnalysis.timeframe}</Badge>
      </div>

      {/* Verdict */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border p-3 ${getSignalBg(verdict.signal)}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            {verdict.signal}
          </span>
          <span className="text-xs font-semibold">{verdict.confidence}%</span>
        </div>
        <p className="text-[10px] opacity-80 line-clamp-2">{verdict.reasoning}</p>
      </motion.div>
    </div>
  );
}

/* ─── Fundamental Overview ─── */
function FundamentalOverview({ data }: { data: FundamentalAnalysis }) {
  return (
    <div className="space-y-3">
      {/* Score */}
      <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 p-3">
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" className="stroke-muted" />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              strokeWidth="3"
              strokeDasharray={`${data.overallScore} ${100 - data.overallScore}`}
              strokeLinecap="round"
              className={data.overallScore >= 70 ? 'stroke-green-400' : data.overallScore >= 40 ? 'stroke-yellow-400' : 'stroke-red-400'}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${getScoreColor(data.overallScore)}`}>
            {data.overallScore}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold">Fundamental Score</p>
          <p className="text-[10px] text-muted-foreground">Rank #{data.marketPosition?.rank ?? '—'} · {data.marketPosition?.dominance ?? '—'} dominance</p>
          <Badge variant="outline" className={`text-[10px] mt-1 ${getSignalBg(data.assessment?.outlook || '')}`}>
            {data.assessment?.outlook || 'Neutral'}
          </Badge>
        </div>
      </div>

      {/* Section scores */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Tokenomics', score: data.tokenomics?.score, icon: Target },
          { label: 'Market', score: data.marketPosition?.score, icon: BarChart3 },
          { label: 'Ecosystem', score: data.ecosystem?.score, icon: Activity },
        ].map(({ label, score, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border/50 bg-muted/30 p-2 text-center">
            <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
            <p className={`text-sm font-bold ${getScoreColor(score ?? 0)}`}>{score ?? '—'}</p>
            <p className="text-[9px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Top risks */}
      {data.risks && data.risks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <Shield className="w-3 h-3" /> Top Risks
          </p>
          {data.risks.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[9px] ${getSeverityColor(r.severity)}`}>
                {r.severity}
              </Badge>
              <span className="text-[10px] text-muted-foreground line-clamp-1">{r.factor}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyAnalysis({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <Icon className="w-8 h-8 text-muted-foreground/50 mb-2" />
      <p className="text-xs text-muted-foreground">Select an asset and run <span className="font-semibold text-foreground">{label}</span> to see insights.</p>
    </div>
  );
}

/* ═══════════════════════ Main Component ═══════════════════════ */
export function MarketInsightsPanel({ assets }: MarketInsightsPanelProps) {
  const navigate = useNavigate();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const {
    technicalData,
    fundamentalData,
    isLoadingTechnical,
    isLoadingFundamental,
    runAnalysis,
  } = useAnalysis();

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const handleRunTechnical = () => {
    if (!selectedAsset) return;
    runAnalysis('technical_analysis', selectedAsset.symbol, selectedAsset.name, selectedAsset.price, selectedAsset.id);
  };

  const handleRunFundamental = () => {
    if (!selectedAsset) return;
    runAnalysis('fundamental_analysis', selectedAsset.symbol, selectedAsset.name, selectedAsset.price, selectedAsset.id);
  };

  return (
    <Card className="glass-card overflow-hidden">
      <Tabs defaultValue="sentiment" className="w-full">
        {/* Tab header - horizontal scroll on mobile */}
        <div className="border-b border-border/50 px-3 pt-3">
          <TabsList className="w-full bg-muted/50 h-9 p-0.5 overflow-x-auto flex-nowrap scrollbar-none">
            <TabsTrigger value="sentiment" className="flex-1 min-w-[100px] text-xs gap-1.5 data-[state=active]:bg-background">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse hidden sm:block" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex-1 min-w-[100px] text-xs gap-1.5 data-[state=active]:bg-background">
              <BarChart3 className="w-3.5 h-3.5" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="fundamental" className="flex-1 min-w-[100px] text-xs gap-1.5 data-[state=active]:bg-background">
              <Target className="w-3.5 h-3.5" />
              Fundamental
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Sentiment ── */}
        <TabsContent value="sentiment" className="mt-0 p-0">
          <FearGreedGauge />
        </TabsContent>

        {/* ── Technical ── */}
        <TabsContent value="technical" className="mt-0 p-3 space-y-3">
          <AssetSelector assets={assets} selectedId={selectedAssetId} onSelect={setSelectedAssetId} />

          {isLoadingTechnical ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Running technical analysis…</p>
            </div>
          ) : technicalData ? (
            <>
              <TechnicalOverview data={technicalData} />
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => navigate(`/analysis/${selectedAssetId}`)}
              >
                View Full Analysis <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <EmptyAnalysis label="Technical Analysis" icon={BarChart3} />
              <Button className="w-full gap-2" size="sm" onClick={handleRunTechnical} disabled={!selectedAsset}>
                <Zap className="w-3.5 h-3.5" /> Run Technical Analysis
              </Button>
            </>
          )}
        </TabsContent>

        {/* ── Fundamental ── */}
        <TabsContent value="fundamental" className="mt-0 p-3 space-y-3">
          <AssetSelector assets={assets} selectedId={selectedAssetId} onSelect={setSelectedAssetId} />

          {isLoadingFundamental ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Running fundamental analysis…</p>
            </div>
          ) : fundamentalData ? (
            <>
              <FundamentalOverview data={fundamentalData} />
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => navigate(`/analysis/${selectedAssetId}`)}
              >
                View Full Analysis <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <EmptyAnalysis label="Fundamental Analysis" icon={Target} />
              <Button className="w-full gap-2" size="sm" onClick={handleRunFundamental} disabled={!selectedAsset}>
                <Zap className="w-3.5 h-3.5" /> Run Fundamental Analysis
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
