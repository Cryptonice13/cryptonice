import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Newspaper, Eye, Loader2, History, Sun, Moon, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePortfolioBrief, type PortfolioBrief } from '@/hooks/usePortfolioBrief';

interface Props {
  portfolio: { symbol: string; asset_id: string; name?: string; amount: number; avg_buy_price: number }[];
}

const SENTIMENT_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  bullish: { bg: 'bg-green-500/15', text: 'text-green-400', icon: TrendingUp },
  bearish: { bg: 'bg-red-500/15', text: 'text-red-400', icon: TrendingDown },
  neutral: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: Eye },
  cautious: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: AlertCircle },
};

function BriefBody({ brief }: { brief: PortfolioBrief }) {
  const d = brief.brief_data;
  const sentimentStyle = SENTIMENT_STYLES[d.outlook?.sentiment] || SENTIMENT_STYLES.neutral;
  const SentIcon = sentimentStyle.icon;

  return (
    <div className="space-y-4">
      {/* Hero summary */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-relaxed">{d.summary}</p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
              <span>Total: <span className="font-mono font-semibold text-foreground">${brief.total_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
              <span>•</span>
              <span className={brief.day_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                {brief.day_change_pct >= 0 ? '+' : ''}{brief.day_change_pct.toFixed(2)}% today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top movers */}
      {d.top_movers?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Movers</h4>
          <div className="space-y-1.5">
            {d.top_movers.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {m.direction === 'up' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="font-semibold text-sm">{m.symbol}</span>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono ${m.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {m.change_pct >= 0 ? '+' : ''}{m.change_pct.toFixed(2)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {m.contribution_usd >= 0 ? '+' : ''}${Math.abs(m.contribution_usd).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why explanations */}
      {d.why_explanations?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Why It Moved</h4>
          <div className="space-y-2">
            {d.why_explanations.map((w, i) => (
              <div key={i} className="text-xs">
                <Badge variant="outline" className="mr-1.5 text-[10px] h-4 px-1.5">{w.symbol}</Badge>
                <span className="text-muted-foreground">{w.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News drivers */}
      {d.news_drivers?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Newspaper className="w-3 h-3" />News Drivers
          </h4>
          <div className="space-y-1.5">
            {d.news_drivers.map((n, i) => (
              <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/20">
                <Badge
                  variant="outline"
                  className={`text-[9px] h-4 px-1 shrink-0 mt-0.5 ${
                    n.impact === 'high' ? 'border-red-500/50 text-red-400' :
                    n.impact === 'medium' ? 'border-yellow-500/50 text-yellow-400' :
                    'border-muted-foreground/30'
                  }`}
                >
                  {n.impact}
                </Badge>
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{n.title}</p>
                  {n.affected_symbols?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Affects: {n.affected_symbols.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outlook */}
      {d.outlook && (
        <div className={`rounded-xl border p-3 ${sentimentStyle.bg} border-border`}>
          <div className="flex items-center gap-2 mb-1.5">
            <SentIcon className={`w-4 h-4 ${sentimentStyle.text}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${sentimentStyle.text}`}>
              Next 24h: {d.outlook.sentiment}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{d.outlook.next_24h}</p>
        </div>
      )}
    </div>
  );
}

export function DailyBrief({ portfolio }: Props) {
  const { todayBrief, history, isGenerating, generateBrief } = usePortfolioBrief();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryBrief, setSelectedHistoryBrief] = useState<PortfolioBrief | null>(null);

  const handleGenerate = async () => {
    await generateBrief(portfolio);
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const isNight = new Date().getHours() < 7 || new Date().getHours() >= 19;

  return (
    <Card className="glass-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            {isNight ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
              Daily Brief
              <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">AI · 3cr</Badge>
            </h2>
            <p className="text-[10px] text-muted-foreground">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={history.length === 0}>
                <History className="w-3 h-3" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[92%] sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Brief History</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                {selectedHistoryBrief ? (
                  <div className="space-y-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedHistoryBrief(null)} className="text-xs">
                      ← Back to list
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedHistoryBrief.brief_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <BriefBody brief={selectedHistoryBrief} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No briefs yet</p>
                    ) : history.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedHistoryBrief(b)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">
                            {new Date(b.brief_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className={`text-xs font-mono ${b.day_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {b.day_change_pct >= 0 ? '+' : ''}{b.day_change_pct.toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{b.brief_data?.summary}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || portfolio.length === 0 || !!todayBrief}
            className="h-8 gap-1.5 text-xs button-gradient"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {todayBrief ? 'Today done' : 'Generate'}
          </Button>
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {todayBrief ? (
            <motion.div key="brief" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <BriefBody brief={todayBrief} />
            </motion.div>
          ) : portfolio.length === 0 ? (
            <motion.div key="empty" className="text-center py-6 text-muted-foreground">
              <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Add portfolio positions first</p>
              <p className="text-xs mt-1">The brief explains why your holdings moved today.</p>
            </motion.div>
          ) : (
            <motion.div key="cta" className="text-center py-6">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-primary opacity-60" />
              <p className="text-sm font-medium mb-1">Get today's personalized brief</p>
              <p className="text-xs text-muted-foreground mb-3">
                Why your portfolio moved, news catalysts driving each holding, and what to watch next.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
