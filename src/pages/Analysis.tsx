import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Activity, TrendingUp, TrendingDown, BarChart3, Shield, Zap,
  Target, AlertTriangle, Clock, ChevronRight, Loader2, RefreshCw,
  Layers, Globe, Rocket, ShieldAlert, Award, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useMarketData, CryptoAsset } from '@/hooks/useMarketData';
import { useAnalysis, TechnicalAnalysis, FundamentalAnalysis } from '@/hooks/useAnalysis';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadialBarChart, RadialBar, ReferenceLine, ComposedChart, Area, Line
} from 'recharts';

export default function Analysis() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { assets } = useMarketData();
  const { technicalData, fundamentalData, isLoadingTechnical, isLoadingFundamental, isLoadingLatest, error, selectedHistoryId, runAnalysis, loadLatestForAsset, forceLoadLatest, selectHistoryItem, loadHistory } = useAnalysis();
  const [activeTab, setActiveTab] = useState('technical');
  const [history, setHistory] = useState<any[]>([]);

  const asset = assets.find(a => a.id === assetId);

  // Load latest analysis from DB on mount / asset change
  useEffect(() => {
    if (assetId) {
      loadLatestForAsset(assetId);
    }
  }, [assetId, loadLatestForAsset]);

  // Refresh history whenever analysis data changes
  useEffect(() => {
    if (assetId) {
      loadHistory(assetId).then(setHistory);
    }
  }, [assetId, loadHistory, technicalData, fundamentalData]);

  const handleRunAnalysis = async (type: 'technical_analysis' | 'fundamental_analysis') => {
    if (!asset) return;
    await runAnalysis(type, asset.symbol, asset.name, asset.price, asset.id);
    // Refresh history after new analysis
    loadHistory(asset.id).then(setHistory);
  };

  if (!asset) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader activePage="markets" />
        <main className="px-4 pt-20 pb-24 text-center">
          <p className="text-muted-foreground">Asset not found. Loading market data...</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/markets')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
          </Button>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="markets" />
      <main className="px-3 sm:px-4 pt-14 pb-20 lg:pb-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mt-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/markets')} className="mb-3 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Markets
          </Button>
          <div className="flex items-center gap-4">
            <img src={asset.logo} alt={asset.name} className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{asset.name}</h1>
                <Badge variant="outline" className="text-xs">{asset.symbol}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-mono font-semibold">${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className={`text-sm font-medium ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="technical" className="gap-2">
              <Activity className="w-4 h-4" /> Technical Analysis
            </TabsTrigger>
            <TabsTrigger value="fundamental" className="gap-2">
              <Globe className="w-4 h-4" /> Fundamental Analysis
            </TabsTrigger>
          </TabsList>

          {/* Technical Analysis Tab */}
          <TabsContent value="technical">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Technical Indicators</h2>
                <Button onClick={() => handleRunAnalysis('technical_analysis')} disabled={isLoadingTechnical} className="gap-2">
                  {isLoadingTechnical ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {isLoadingTechnical ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>

              {isLoadingTechnical && <TechnicalSkeleton />}

              {technicalData && !isLoadingTechnical && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Verdict Card */}
                  <VerdictCard verdict={technicalData.verdict} />

                  {/* Indicator Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RSICard rsi={technicalData.indicators.rsi} />
                    <MACDCard macd={technicalData.indicators.macd} />
                    <BollingerCard bb={technicalData.indicators.bollingerBands} price={asset.price} />
                    <MACard ma={technicalData.indicators.movingAverages} />
                  </div>

                  {/* Support & Resistance */}
                  <SupportResistanceCard sr={technicalData.supportResistance} price={asset.price} />

                  {/* Volume & Trend */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <VolumeCard volume={technicalData.volumeAnalysis} />
                    <TrendCard trend={technicalData.trendAnalysis} />
                  </div>

                  {/* Chart Patterns */}
                  {technicalData.chartPatterns?.length > 0 && (
                    <PatternsCard patterns={technicalData.chartPatterns} />
                  )}
                </motion.div>
              )}

              {!technicalData && !isLoadingTechnical && (
                <EmptyState type="technical" onRun={() => handleRunAnalysis('technical_analysis')} />
              )}
            </div>
          </TabsContent>

          {/* Fundamental Analysis Tab */}
          <TabsContent value="fundamental">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Fundamental Analysis</h2>
                <Button onClick={() => handleRunAnalysis('fundamental_analysis')} disabled={isLoadingFundamental} className="gap-2">
                  {isLoadingFundamental ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {isLoadingFundamental ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>

              {isLoadingFundamental && <FundamentalSkeleton />}

              {fundamentalData && !isLoadingFundamental && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Overall Score */}
                  <ScoreCard score={fundamentalData.overallScore} assessment={fundamentalData.assessment} />

                  {/* Section Scores */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SectionScoreCard title="Tokenomics" score={fundamentalData.tokenomics.score} icon={<Layers className="w-4 h-4" />} description={fundamentalData.tokenomics.description} />
                    <SectionScoreCard title="Market Position" score={fundamentalData.marketPosition.score} icon={<Award className="w-4 h-4" />} description={fundamentalData.marketPosition.description} />
                    <SectionScoreCard title="Ecosystem" score={fundamentalData.ecosystem.score} icon={<Globe className="w-4 h-4" />} description={fundamentalData.ecosystem.description} />
                  </div>

                  {/* Tokenomics Detail */}
                  <TokenomicsCard data={fundamentalData.tokenomics} />

                  {/* Catalysts & Risks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CatalystsCard catalysts={fundamentalData.catalysts} />
                    <RisksCard risks={fundamentalData.risks} />
                  </div>

                  {/* Ecosystem */}
                  <EcosystemCard data={fundamentalData.ecosystem} market={fundamentalData.marketPosition} />
                </motion.div>
              )}

              {!fundamentalData && !isLoadingFundamental && (
                <EmptyState type="fundamental" onRun={() => handleRunAnalysis('fundamental_analysis')} />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Past Analyses</h3>
            <div className="space-y-2">
              {history.map((item: any) => (
                <Card
                  key={item.id}
                  onClick={() => {
                    selectHistoryItem(item);
                    setActiveTab(item.analysis_type === 'technical' ? 'technical' : 'fundamental');
                  }}
                  className={`glass-card p-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/50 ${selectedHistoryId === item.id ? 'ring-1 ring-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs capitalize">{item.analysis_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">${Number(item.current_price).toLocaleString()}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}

// === Sub Components ===

function EmptyState({ type, onRun }: { type: string; onRun: () => void }) {
  return (
    <Card className="glass-card p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        {type === 'technical' ? <Activity className="w-8 h-8 text-primary" /> : <Globe className="w-8 h-8 text-primary" />}
      </div>
      <h3 className="font-semibold text-lg mb-2">{type === 'technical' ? 'Technical Analysis' : 'Fundamental Analysis'}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
        {type === 'technical'
          ? 'Get AI-powered technical indicators, support/resistance levels, chart patterns, and trading signals.'
          : 'Evaluate tokenomics, ecosystem health, growth catalysts, and risk factors for informed decisions.'}
      </p>
      <Button onClick={onRun} className="gap-2"><Zap className="w-4 h-4" /> Run {type === 'technical' ? 'Technical' : 'Fundamental'} Analysis</Button>
    </Card>
  );
}

function VerdictCard({ verdict }: { verdict: TechnicalAnalysis['verdict'] }) {
  const color = verdict.signal === 'BUY' ? 'text-green-400' : verdict.signal === 'SELL' ? 'text-red-400' : 'text-yellow-400';
  const bgColor = verdict.signal === 'BUY' ? 'bg-green-500/10 border-green-500/20' : verdict.signal === 'SELL' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20';
  return (
    <Card className={`p-5 border ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4" /> AI Verdict</h3>
        <Badge className={`text-lg px-4 py-1 ${color} bg-transparent border ${verdict.signal === 'BUY' ? 'border-green-500/40' : verdict.signal === 'SELL' ? 'border-red-500/40' : 'border-yellow-500/40'}`}>{verdict.signal}</Badge>
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Confidence</p>
          <p className="text-2xl font-bold">{verdict.confidence}%</p>
        </div>
        <div className="flex-1">
          <Progress value={verdict.confidence} className="h-2" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{verdict.reasoning}</p>
      {verdict.keyLevels && (
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border/50">
          <div><p className="text-[10px] text-muted-foreground">Entry</p><p className="text-sm font-mono font-semibold text-green-400">${verdict.keyLevels.entry?.toLocaleString()}</p></div>
          <div><p className="text-[10px] text-muted-foreground">Stop Loss</p><p className="text-sm font-mono font-semibold text-red-400">${verdict.keyLevels.stopLoss?.toLocaleString()}</p></div>
          <div><p className="text-[10px] text-muted-foreground">Target</p><p className="text-sm font-mono font-semibold text-primary">${verdict.keyLevels.target?.toLocaleString()}</p></div>
        </div>
      )}
    </Card>
  );
}

function RSICard({ rsi }: { rsi: TechnicalAnalysis['indicators']['rsi'] }) {
  const color = rsi.value > 70 ? 'text-red-400' : rsi.value < 30 ? 'text-green-400' : 'text-yellow-400';
  const gaugeData = [{ value: rsi.value, fill: rsi.value > 70 ? 'hsl(0, 84%, 60%)' : rsi.value < 30 ? 'hsl(160, 84%, 45%)' : 'hsl(45, 93%, 47%)' }];
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">RSI (14)</h4>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={gaugeData}>
              <RadialBar dataKey="value" cornerRadius={5} max={100} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1">
          <p className={`text-2xl font-bold ${color}`}>{rsi.value}</p>
          <Badge variant="outline" className="text-[10px] capitalize mt-1">{rsi.signal}</Badge>
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{rsi.description}</p>
        </div>
      </div>
    </Card>
  );
}

function MACDCard({ macd }: { macd: TechnicalAnalysis['indicators']['macd'] }) {
  const color = macd.signal === 'bullish' ? 'text-green-400' : macd.signal === 'bearish' ? 'text-red-400' : 'text-muted-foreground';
  const Icon = macd.signal === 'bullish' ? TrendingUp : macd.signal === 'bearish' ? TrendingDown : Minus;
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">MACD</h4>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${macd.signal === 'bullish' ? 'bg-green-500/10' : macd.signal === 'bearish' ? 'bg-red-500/10' : 'bg-muted'}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-lg font-bold ${color}`}>{macd.value?.toFixed(2)}</p>
            <Badge variant="outline" className="text-[10px] capitalize">{macd.signal}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">Histogram: {macd.histogram?.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{macd.description}</p>
        </div>
      </div>
    </Card>
  );
}

function BollingerCard({ bb, price }: { bb: TechnicalAnalysis['indicators']['bollingerBands']; price: number }) {
  const bands = [
    { name: 'Upper', value: bb.upper },
    { name: 'Middle', value: bb.middle },
    { name: 'Price', value: price },
    { name: 'Lower', value: bb.lower },
  ].sort((a, b) => b.value - a.value);
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Bollinger Bands</h4>
      <div className="space-y-2">
        {bands.map(b => (
          <div key={b.name} className="flex justify-between items-center">
            <span className={`text-xs ${b.name === 'Price' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{b.name}</span>
            <span className={`text-xs font-mono ${b.name === 'Price' ? 'text-primary font-semibold' : ''}`}>${b.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <Badge variant="outline" className="text-[10px] capitalize mt-2">{bb.position?.replace(/_/g, ' ')}</Badge>
      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{bb.description}</p>
    </Card>
  );
}

function MACard({ ma }: { ma: TechnicalAnalysis['indicators']['movingAverages'] }) {
  const color = ma.trend === 'bullish' ? 'text-green-400' : ma.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400';
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Moving Averages</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-muted-foreground">SMA 20</span><p className="font-mono">${ma.sma20?.toLocaleString()}</p></div>
        <div><span className="text-muted-foreground">SMA 50</span><p className="font-mono">${ma.sma50?.toLocaleString()}</p></div>
        <div><span className="text-muted-foreground">SMA 200</span><p className="font-mono">${ma.sma200?.toLocaleString()}</p></div>
        <div><span className="text-muted-foreground">EMA 12</span><p className="font-mono">${ma.ema12?.toLocaleString()}</p></div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className={`text-[10px] capitalize ${color}`}>{ma.trend}</Badge>
        {ma.crossover !== 'none' && <Badge className="text-[10px] capitalize bg-primary/20 text-primary">{ma.crossover?.replace(/_/g, ' ')}</Badge>}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{ma.description}</p>
    </Card>
  );
}

function SupportResistanceCard({ sr, price }: { sr: TechnicalAnalysis['supportResistance']; price: number }) {
  const allLevels = [
    ...sr.resistances.map(r => ({ ...r, type: 'resistance' as const })),
    { price, strength: 'current', type: 'current' as const },
    ...sr.supports.map(s => ({ ...s, type: 'support' as const })),
  ].sort((a, b) => b.price - a.price);

  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3">Support & Resistance Levels</h4>
      <div className="space-y-2">
        {allLevels.map((level, i) => (
          <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${level.type === 'current' ? 'bg-primary/10 border border-primary/20' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${level.type === 'resistance' ? 'bg-red-400' : level.type === 'support' ? 'bg-green-400' : 'bg-primary'}`} />
            <span className={`text-xs flex-1 ${level.type === 'current' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
              {level.type === 'current' ? 'Current Price' : level.type === 'resistance' ? 'Resistance' : 'Support'}
            </span>
            <span className={`text-sm font-mono font-semibold ${level.type === 'resistance' ? 'text-red-400' : level.type === 'support' ? 'text-green-400' : 'text-primary'}`}>
              ${level.price?.toLocaleString()}
            </span>
            {level.type !== 'current' && (
              <Badge variant="outline" className="text-[10px] capitalize">{level.strength}</Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function VolumeCard({ volume }: { volume: TechnicalAnalysis['volumeAnalysis'] }) {
  const Icon = volume.trend === 'increasing' ? TrendingUp : volume.trend === 'decreasing' ? TrendingDown : Minus;
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Volume Analysis</h4>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${volume.trend === 'increasing' ? 'text-green-400' : volume.trend === 'decreasing' ? 'text-red-400' : 'text-muted-foreground'}`} />
        <Badge variant="outline" className="text-[10px] capitalize">{volume.trend}</Badge>
        <span className="text-xs text-muted-foreground">Ratio: {volume.volumeRatio?.toFixed(2)}x</span>
      </div>
      <p className="text-[10px] text-muted-foreground line-clamp-3">{volume.description}</p>
    </Card>
  );
}

function TrendCard({ trend }: { trend: TechnicalAnalysis['trendAnalysis'] }) {
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Trend Analysis</h4>
      <div className="flex items-center gap-2 mb-2">
        <Badge className={`text-xs capitalize ${trend.direction === 'bullish' ? 'bg-green-500/20 text-green-400' : trend.direction === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {trend.direction}
        </Badge>
        <span className="text-xs text-muted-foreground">Strength: {trend.strength}/10</span>
      </div>
      <Progress value={trend.strength * 10} className="h-1.5 mb-2" />
      <p className="text-[10px] text-muted-foreground line-clamp-3">{trend.description}</p>
    </Card>
  );
}

function PatternsCard({ patterns }: { patterns: TechnicalAnalysis['chartPatterns'] }) {
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3">Chart Patterns Detected</h4>
      <div className="space-y-2">
        {patterns.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${p.type === 'bullish' ? 'bg-green-400' : p.type === 'bearish' ? 'bg-red-400' : 'bg-yellow-400'}`} />
              <span className="text-sm">{p.pattern}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] capitalize">{p.type}</Badge>
              <Badge variant="outline" className="text-[10px] capitalize">{p.significance}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ScoreCard({ score, assessment }: { score: number; assessment: FundamentalAnalysis['assessment'] }) {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  const bgColor = score >= 70 ? 'bg-green-500/10 border-green-500/20' : score >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';
  return (
    <Card className={`p-5 border ${bgColor}`}>
      <div className="flex items-start gap-6">
        <div className="text-center">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={score >= 70 ? 'hsl(160, 84%, 45%)' : score >= 40 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 84%, 60%)'} strokeWidth="8" strokeDasharray={`${score * 2.51} 251`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${color}`}>{score}</span>
            </div>
          </div>
          <Badge className={`mt-1 capitalize ${assessment.outlook === 'bullish' ? 'bg-green-500/20 text-green-400' : assessment.outlook === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {assessment.outlook}
          </Badge>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Investment Thesis</h3>
          <p className="text-sm text-muted-foreground mb-3">{assessment.thesis}</p>
          <p className="text-xs text-muted-foreground">{assessment.summary}</p>
        </div>
      </div>
    </Card>
  );
}

function SectionScoreCard({ title, score, icon, description }: { title: string; score: number; icon: React.ReactNode; description: string }) {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  return (
    <Card className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-xs font-semibold">{title}</h4>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <Progress value={score} className="h-1.5 mb-2" />
      <p className="text-[10px] text-muted-foreground line-clamp-3">{description}</p>
    </Card>
  );
}

function TokenomicsCard({ data }: { data: FundamentalAnalysis['tokenomics'] }) {
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Tokenomics</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><p className="text-[10px] text-muted-foreground">Circulating</p><p className="text-sm font-semibold">{data.circulatingSupply}</p></div>
        <div><p className="text-[10px] text-muted-foreground">Max Supply</p><p className="text-sm font-semibold">{data.maxSupply}</p></div>
        <div><p className="text-[10px] text-muted-foreground">Inflation</p><p className="text-sm font-semibold">{data.inflationRate}</p></div>
        <div><p className="text-[10px] text-muted-foreground">Distribution</p><p className="text-sm font-semibold">{data.distribution}</p></div>
      </div>
    </Card>
  );
}

function CatalystsCard({ catalysts }: { catalysts: FundamentalAnalysis['catalysts'] }) {
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2"><Rocket className="w-3.5 h-3.5" /> Growth Catalysts</h4>
      <div className="space-y-2">
        {catalysts?.map((c, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
            <div className={`w-2 h-2 rounded-full mt-1.5 ${c.impact === 'high' ? 'bg-green-400' : c.impact === 'medium' ? 'bg-yellow-400' : 'bg-muted-foreground'}`} />
            <div className="flex-1">
              <p className="text-xs font-medium">{c.event}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] capitalize">{c.impact} impact</Badge>
                <span className="text-[10px] text-muted-foreground">{c.timeframe}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RisksCard({ risks }: { risks: FundamentalAnalysis['risks'] }) {
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" /> Risk Factors</h4>
      <div className="space-y-2">
        {risks?.map((r, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 ${r.severity === 'high' ? 'text-red-400' : r.severity === 'medium' ? 'text-yellow-400' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <p className="text-xs font-medium">{r.factor}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] capitalize ${r.severity === 'high' ? 'border-red-500/40 text-red-400' : ''}`}>{r.severity}</Badge>
                <span className="text-[10px] text-muted-foreground">Likelihood: {r.likelihood}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EcosystemCard({ data, market }: { data: FundamentalAnalysis['ecosystem']; market: FundamentalAnalysis['marketPosition'] }) {
  return (
    <Card className="glass-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Ecosystem & Market Position</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div><p className="text-[10px] text-muted-foreground">Rank</p><p className="text-sm font-semibold">#{market.rank}</p></div>
        <div><p className="text-[10px] text-muted-foreground">Dominance</p><p className="text-sm font-semibold">{market.dominance}</p></div>
        <div><p className="text-[10px] text-muted-foreground">Dev Activity</p><p className="text-sm font-semibold capitalize">{data.activity}</p></div>
        <div><p className="text-[10px] text-muted-foreground">dApps</p><p className="text-sm font-semibold">{data.dapps}+</p></div>
      </div>
      {market.competitors?.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Competitors</p>
          <div className="flex flex-wrap gap-1">
            {market.competitors.map((c, i) => <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>)}
          </div>
        </div>
      )}
      {market.moat && <p className="text-[10px] text-muted-foreground mt-2"><span className="font-medium text-foreground">Moat:</span> {market.moat}</p>}
    </Card>
  );
}

function TechnicalSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function FundamentalSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-3 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
