import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles, Loader2, CheckCircle2, Circle, BarChart3, Target, Activity,
  Brain, Waves, Cpu, Zap, ChevronRight, AlertCircle, History, Trash2, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketData, type CryptoAsset } from '@/hooks/useMarketData';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useMarketPrediction, useTradingSignal } from '@/hooks/useCryptoAI';
import { useStrategyBuilder } from '@/hooks/useStrategyBuilder';
import { useAccount } from 'wagmi';
import { invokeCryptoAI, readCryptoAIError } from '@/lib/cryptoAIClient';
import { FearGreedGauge } from '@/components/ai/FearGreedGauge';
import StrategyDetailCard from '@/components/strategy/StrategyDetailCard';
import { formatPrice } from '@/lib/format';

const HISTORY_KEY = 'agent-run-history-v1';
const HISTORY_LIMIT = 20;

interface HistoryRun {
  id: string;
  timestamp: number;
  assetSymbol: string;
  assetName: string;
  assetLogo?: string;
  price: number;
  technicalData: any;
  fundamentalData: any;
  prediction: any;
  signal: any;
  whaleSentiment: string | null;
  whaleSummary: string | null;
  strategyResult: any;
}

function loadHistory(): HistoryRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHistory(items: HistoryRun[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT))); } catch {}
}

interface Props {
  selectedAssetId: string | null;
  onSelectAsset: (asset: CryptoAsset | null) => void;
  onStrategyResult?: (markdown: string) => void;
}

type Phase = 'idle' | 'analysis' | 'signals' | 'strategy' | 'done';
type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface StepState {
  technical: StepStatus;
  fundamental: StepStatus;
  sentiment: StepStatus;
  prediction: StepStatus;
  signal: StepStatus;
  whales: StepStatus;
  strategy: StepStatus;
}

const INITIAL: StepState = {
  technical: 'pending', fundamental: 'pending', sentiment: 'pending',
  prediction: 'pending', signal: 'pending', whales: 'pending',
  strategy: 'pending',
};

function StepDot({ status, label, icon: Icon }: { status: StepStatus; label: string; icon: any }) {
  return (
    <div className="flex items-center gap-2">
      {status === 'running' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
      ) : status === 'done' ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
      ) : status === 'error' ? (
        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
      )}
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className={`text-[11px] ${status === 'done' ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}

function PhaseHeader({ n, title, active, done }: { n: number; title: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border ${
        done ? 'bg-green-500/15 border-green-500/40 text-green-400'
        : active ? 'bg-primary/15 border-primary/40 text-primary'
        : 'bg-muted/30 border-border/40 text-muted-foreground'
      }`}>{done ? '✓' : n}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

export default function AgentRunTab({ selectedAssetId, onSelectAsset, onStrategyResult }: Props) {
  const { assets } = useMarketData();
  const { address } = useAccount();
  const selected = selectedAssetId ? assets.find(a => a.id === selectedAssetId) : null;

  const { technicalData, fundamentalData, runAnalysis } = useAnalysis();
  const { prediction, getPrediction } = useMarketPrediction();
  const { signal, getSignal } = useTradingSignal();
  const { lastResult: strategyResult, generateStrategy } = useStrategyBuilder();

  const [steps, setSteps] = useState<StepState>(INITIAL);
  const [phase, setPhase] = useState<Phase>('idle');
  const [whaleSentiment, setWhaleSentiment] = useState<string | null>(null);
  const [whaleSummary, setWhaleSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof StepState, s: StepStatus) => setSteps(prev => ({ ...prev, [k]: s }));

  const runWhales = useCallback(async (sym: string, price: number) => {
    update('whales', 'running');
    try {
      const res = await invokeCryptoAI({
        type: 'whale_analysis',
        messages: [{ role: 'user', content: `Whale activity for ${sym}` }],
        context: { symbol: sym, price },
        walletAddress: address,
      });
      if (!res.ok) throw new Error(await readCryptoAIError(res));
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      try {
        const clean = content.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim();
        const parsed = JSON.parse(clean);
        setWhaleSentiment(parsed.sentiment || 'neutral');
        setWhaleSummary(parsed.summary || null);
      } catch {
        setWhaleSummary(content);
      }
      update('whales', 'done');
    } catch (e) {
      update('whales', 'error');
    }
  }, [address]);

  const runFullPipeline = useCallback(async () => {
    if (!selected) return;
    setError(null);
    setSteps(INITIAL);
    setWhaleSentiment(null);
    setWhaleSummary(null);

    try {
      // PHASE 1: Analysis (parallel)
      setPhase('analysis');
      update('technical', 'running');
      update('fundamental', 'running');
      update('sentiment', 'running');
      await Promise.allSettled([
        runAnalysis('technical_analysis', selected.symbol, selected.name, selected.price, selected.id)
          .then(() => update('technical', 'done')).catch(() => update('technical', 'error')),
        runAnalysis('fundamental_analysis', selected.symbol, selected.name, selected.price, selected.id)
          .then(() => update('fundamental', 'done')).catch(() => update('fundamental', 'error')),
      ]);
      update('sentiment', 'done'); // sentiment is live gauge, no API gate

      // PHASE 2: Predictions / Signal / Whales (parallel)
      setPhase('signals');
      update('prediction', 'running');
      update('signal', 'running');
      await Promise.allSettled([
        getPrediction(selected.symbol).then(() => update('prediction', 'done')).catch(() => update('prediction', 'error')),
        getSignal(selected.symbol, selected.price).then(() => update('signal', 'done')).catch(() => update('signal', 'error')),
        runWhales(selected.symbol, selected.price),
      ]);

      // PHASE 3: Strategy
      setPhase('strategy');
      update('strategy', 'running');
      const res = await generateStrategy({
        assetSymbol: selected.symbol,
        assetId: selected.id,
        strategyType: 'momentum',
        riskLevel: 'moderate',
        timeframe: '1W',
        investmentAmount: 1000,
      });
      if (res) {
        update('strategy', 'done');
        if (onStrategyResult) {
          onStrategyResult(`## 📊 Strategy: ${res.strategyName} (${selected.symbol})\n**Signal:** ${res.signal} · **Confidence:** ${res.confidence}%\n${res.reasoning || ''}`);
        }
      } else {
        update('strategy', 'error');
      }
      setPhase('done');
    } catch (e: any) {
      setError(e?.message || 'Pipeline failed');
    }
  }, [selected, runAnalysis, getPrediction, getSignal, runWhales, generateStrategy, onStrategyResult]);

  const isRunning = phase !== 'idle' && phase !== 'done';

  return (
    <div className="space-y-3">
      {/* Asset Selector + Run Button */}
      <Card className="glass-card p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Full AI Agent</h3>
            <p className="text-[10px] text-muted-foreground">Runs analysis → predictions → strategy</p>
          </div>
        </div>

        <Select value={selectedAssetId || ''} onValueChange={(v) => onSelectAsset(assets.find(a => a.id === v) || null)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select asset…" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {assets.slice(0, 50).map(a => (
              <SelectItem key={a.id} value={a.id}>
                <span className="flex items-center gap-2">
                  <img src={a.logo} alt="" className="w-4 h-4 rounded-full" />
                  <span className="font-medium">{a.symbol}</span>
                  <span className="text-muted-foreground text-xs">{formatPrice(a.price)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={runFullPipeline}
          disabled={!selected || isRunning}
          className="w-full button-gradient h-10 gap-2"
        >
          {isRunning ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running agent…</>
          ) : (
            <><Zap className="w-4 h-4" /> Analyze {selected?.symbol || ''}</>
          )}
        </Button>

        {/* Step checklist */}
        {phase !== 'idle' && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-border/40">
            <StepDot status={steps.technical} label="Technical" icon={BarChart3} />
            <StepDot status={steps.fundamental} label="Fundamental" icon={Target} />
            <StepDot status={steps.sentiment} label="Sentiment" icon={Activity} />
            <StepDot status={steps.prediction} label="Prediction" icon={Brain} />
            <StepDot status={steps.signal} label="Signal" icon={Zap} />
            <StepDot status={steps.whales} label="Whales" icon={Waves} />
            <StepDot status={steps.strategy} label="Strategy" icon={Cpu} />
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </Card>

      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* PHASE 1: ANALYSIS */}
            <div>
              <PhaseHeader n={1} title="Market Analysis" active={phase === 'analysis'} done={steps.technical === 'done' && steps.fundamental === 'done'} />
              <div className="grid grid-cols-1 gap-3">
                {/* Sentiment */}
                <Card className="glass-card overflow-hidden">
                  <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold">Sentiment</span>
                  </div>
                  <FearGreedGauge />
                </Card>

                {/* Technical */}
                {technicalData && (
                  <Card className="glass-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-primary" /> Technical</span>
                      <Badge variant="outline" className="text-[10px]">{technicalData.verdict?.signal}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded bg-muted/30 p-1.5 text-center">
                        <p className="text-muted-foreground text-[9px]">RSI</p>
                        <p className="font-mono font-bold">{technicalData.indicators?.rsi?.value}</p>
                      </div>
                      <div className="rounded bg-muted/30 p-1.5 text-center">
                        <p className="text-muted-foreground text-[9px]">MACD</p>
                        <p className="font-mono font-bold">{technicalData.indicators?.macd?.signal}</p>
                      </div>
                      <div className="rounded bg-muted/30 p-1.5 text-center">
                        <p className="text-muted-foreground text-[9px]">Trend</p>
                        <p className="font-mono font-bold">{technicalData.trendAnalysis?.direction}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-3">{technicalData.verdict?.reasoning}</p>
                  </Card>
                )}

                {/* Fundamental */}
                {fundamentalData && (
                  <Card className="glass-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-primary" /> Fundamental</span>
                      <Badge variant="outline" className="text-[10px]">Score {fundamentalData.overallScore}/100</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-3">{fundamentalData.assessment?.thesis || fundamentalData.assessment?.summary}</p>
                  </Card>
                )}
              </div>
            </div>

            {/* PHASE 2: PREDICTIONS */}
            {(phase === 'signals' || phase === 'strategy' || phase === 'done') && (
              <div>
                <PhaseHeader n={2} title="Predictions & Signals" active={phase === 'signals'} done={steps.prediction === 'done' && steps.signal === 'done'} />
                <div className="space-y-3">
                  {prediction && (
                    <Card className="glass-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-primary" /> Prediction</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{prediction.sentiment}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded bg-muted/30 p-2">
                          <p className="text-muted-foreground text-[9px] uppercase">Short-term</p>
                          <p className="font-semibold capitalize">{prediction.shortTerm?.direction}</p>
                        </div>
                        <div className="rounded bg-muted/30 p-2">
                          <p className="text-muted-foreground text-[9px] uppercase">Medium-term</p>
                          <p className="font-semibold capitalize">{prediction.mediumTerm?.direction}</p>
                        </div>
                      </div>
                      {prediction.analysis && <p className="text-[11px] text-muted-foreground line-clamp-3">{prediction.analysis}</p>}
                    </Card>
                  )}

                  {signal && (
                    <Card className="glass-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" /> Trading Signal</span>
                        <Badge className={
                          signal.signal === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : signal.signal === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }>{signal.signal}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div className="rounded bg-muted/30 p-1.5">
                          <p className="text-muted-foreground text-[9px]">Entry</p>
                          <p className="font-mono">${signal.entryRange?.min}</p>
                        </div>
                        <div className="rounded bg-red-500/10 p-1.5">
                          <p className="text-muted-foreground text-[9px]">Stop</p>
                          <p className="font-mono text-red-400">${signal.stopLoss}</p>
                        </div>
                        <div className="rounded bg-green-500/10 p-1.5">
                          <p className="text-muted-foreground text-[9px]">TP1</p>
                          <p className="font-mono text-green-400">${signal.takeProfits?.[0]}</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {(whaleSentiment || whaleSummary) && (
                    <Card className="glass-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold flex items-center gap-1.5"><Waves className="w-3.5 h-3.5 text-primary" /> Whale Activity</span>
                        {whaleSentiment && <Badge variant="outline" className="text-[10px] capitalize">{whaleSentiment}</Badge>}
                      </div>
                      {whaleSummary && <p className="text-[11px] text-muted-foreground line-clamp-3">{whaleSummary}</p>}
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* PHASE 3: STRATEGY */}
            {(phase === 'strategy' || phase === 'done') && (
              <div>
                <PhaseHeader n={3} title="Trading Strategy" active={phase === 'strategy'} done={steps.strategy === 'done'} />
                {strategyResult && selected ? (
                  <StrategyDetailCard result={strategyResult} assetSymbol={selected.symbol} />
                ) : steps.strategy === 'running' ? (
                  <Card className="glass-card p-6 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Building strategy…</p>
                  </Card>
                ) : null}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
