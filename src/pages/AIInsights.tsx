import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Target, Fish, Trash2, Loader2, Clock, TrendingUp, TrendingDown,
  Minus, ChevronDown, AlertTriangle, CheckCircle, RefreshCw, Brain, PieChart, Shield
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIInsights } from '@/hooks/useAIInsights';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';

function formatPrice(v: any): string {
  if (typeof v === 'number') return `$${v.toLocaleString()}`;
  if (typeof v === 'string') return v.startsWith('$') ? v : `$${v}`;
  return '$0';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Prediction card for history
function PredictionHistoryItem({ item, onDelete }: { item: any; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const p = item.prediction_data;

  const getSentimentColor = (s: string) => {
    const sl = s?.toLowerCase();
    if (sl?.includes('bullish')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (sl?.includes('bearish')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{item.asset_symbol}</span>
                <Badge className={getSentimentColor(p?.sentiment)}>{p?.sentiment || 'N/A'}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo(item.created_at)}
                <span>·</span>
                <span className="font-mono">${item.current_price?.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          {/* Short/Medium term */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/20 border border-border/30 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Short-term</p>
              <p className="text-sm font-semibold capitalize">{p?.shortTerm?.direction || 'N/A'}</p>
              {p?.shortTerm?.target && <p className="text-xs text-muted-foreground">Target: {formatPrice(p.shortTerm.target)}</p>}
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/30 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Medium-term</p>
              <p className="text-sm font-semibold capitalize">{p?.mediumTerm?.direction || 'N/A'}</p>
              {p?.mediumTerm?.target && <p className="text-xs text-muted-foreground">Target: {formatPrice(p.mediumTerm.target)}</p>}
            </div>
          </div>

          {/* Support/Resistance */}
          {((p?.supportLevels?.length ?? 0) > 0 || (p?.resistanceLevels?.length ?? 0) > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Support</p>
                <div className="flex flex-wrap gap-1">
                  {p?.supportLevels?.slice(0, 3).map((l: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-green-400 border-green-500/30 text-[10px]">{formatPrice(l)}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Resistance</p>
                <div className="flex flex-wrap gap-1">
                  {p?.resistanceLevels?.slice(0, 3).map((l: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-red-400 border-red-500/30 text-[10px]">{formatPrice(l)}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analysis collapsible */}
          {p?.analysis && (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold">Analysis</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 rounded-lg bg-muted/10 border border-border/30">
                  <p className="text-sm leading-relaxed">{p.analysis}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Signal card for history
function SignalHistoryItem({ item, onDelete }: { item: any; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const s = item.signal_data;

  const getSignalStyle = (sig: string) => {
    switch (sig) {
      case 'BUY': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'SELL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{item.asset_symbol}</span>
                <Badge className={getSignalStyle(s?.signal)}>{s?.signal || 'HOLD'}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo(item.created_at)}
                <span>·</span>
                <span className="font-mono">${item.current_price?.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/20 border border-border/30 p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Entry</p>
              <p className="font-mono text-xs">{formatPrice(s?.entryRange?.min)} – {formatPrice(s?.entryRange?.max)}</p>
            </div>
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Stop Loss</p>
              <p className="font-mono text-xs text-red-400">{formatPrice(s?.stopLoss)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/30 p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Strength</p>
              <p className="font-bold text-sm">{s?.strength || 0}<span className="text-muted-foreground text-xs">/10</span></p>
            </div>
          </div>

          {s?.takeProfits?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {s.takeProfits.map((tp: any, i: number) => (
                <Badge key={i} variant="outline" className="text-green-400 border-green-500/30 text-[10px] font-mono">
                  TP{i + 1}: {formatPrice(tp)}
                </Badge>
              ))}
            </div>
          )}

          {s?.reasoning && (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold">Analysis</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 rounded-lg bg-muted/10 border border-border/30">
                  <p className="text-sm leading-relaxed">{s.reasoning}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Whale card for history
function WhaleHistoryItem({ item, onDelete }: { item: any; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const w = item.whale_data;

  const getSentimentStyle = (s: string) => {
    if (s === 'accumulation') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (s === 'distribution') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <span className="text-lg">🐋</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{item.asset_symbol}</span>
                <Badge className={getSentimentStyle(w?.sentiment)}>
                  {w?.sentiment || 'neutral'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo(item.created_at)}
                <span>·</span>
                <span className="font-mono">${item.current_price?.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          {/* Transactions */}
          {w?.transactions?.length > 0 && (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Transactions</span>
                  <Badge variant="secondary" className="text-[10px] h-5">{w.transactions.length}</Badge>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-1.5">
                  {w.transactions.slice(0, 5).map((tx: any, i: number) => (
                    <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${
                      tx.type === 'buy' ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${tx.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type?.toUpperCase()}
                        </span>
                        <span className="text-xs">{tx.amount}</span>
                      </div>
                      <span className="text-xs font-mono">{tx.value}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {w?.summary && (
            <div className="p-3 rounded-lg bg-muted/10 border border-border/30">
              <p className="text-sm leading-relaxed">{w.summary}</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function AIInsights() {
  const {
    predictions, signals, whaleActivities, isLoading,
    loadAll, deletePrediction, deleteSignal, deleteWhaleActivity,
  } = useAIInsights();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const totalInsights = predictions.length + signals.length + whaleActivities.length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="markets" />

      <main className="px-3 sm:px-4 pt-14 pb-20 lg:pb-8">
        <div className="mt-4 space-y-4">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">AI Insights</h1>
                <Badge variant="secondary" className="text-xs">{totalInsights} saved</Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Your saved predictions, signals & whale activity</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadAll} disabled={isLoading} className="gap-1.5">
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {isLoading && totalInsights === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading your AI insights...</p>
            </div>
          ) : (
            <Tabs defaultValue="predictions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="predictions" className="text-xs gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Predictions
                  {predictions.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">{predictions.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="signals" className="text-xs gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Signals
                  {signals.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">{signals.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="whales" className="text-xs gap-1.5">
                  <span>🐋</span>
                  Whales
                  {whaleActivities.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">{whaleActivities.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="predictions" className="mt-4">
                {predictions.length === 0 ? (
                  <Card className="glass-card p-10 text-center">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No Predictions Yet</h3>
                    <p className="text-xs text-muted-foreground">Generate predictions from the Markets page — they'll be saved here automatically.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {predictions.map(item => (
                      <PredictionHistoryItem key={item.id} item={item} onDelete={deletePrediction} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signals" className="mt-4">
                {signals.length === 0 ? (
                  <Card className="glass-card p-10 text-center">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No Signals Yet</h3>
                    <p className="text-xs text-muted-foreground">Generate trading signals from the Markets page — they'll be saved here automatically.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {signals.map(item => (
                      <SignalHistoryItem key={item.id} item={item} onDelete={deleteSignal} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="whales" className="mt-4">
                {whaleActivities.length === 0 ? (
                  <Card className="glass-card p-10 text-center">
                    <span className="text-4xl block mb-3">🐋</span>
                    <h3 className="font-semibold mb-1">No Whale Activity Yet</h3>
                    <p className="text-xs text-muted-foreground">Track whale movements from the Markets page — they'll be saved here automatically.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {whaleActivities.map(item => (
                      <WhaleHistoryItem key={item.id} item={item} onDelete={deleteWhaleActivity} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
