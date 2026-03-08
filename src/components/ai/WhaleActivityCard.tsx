import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Fish, ArrowDownRight, ArrowUpRight, RefreshCw, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface WhaleTransaction {
  type: 'buy' | 'sell';
  amount: string;
  value: string;
  timeAgo: string;
  exchange: string;
  significance: 'high' | 'medium' | 'low';
}

interface WhaleAnalysis {
  transactions: WhaleTransaction[];
  sentiment: 'accumulation' | 'distribution' | 'neutral';
  summary: string;
}

interface WhaleActivityCardProps {
  symbol: string;
  name: string;
  price: number;
}

function extractJSON(raw: string): string {
  let str = raw.trim();
  const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) str = fenceMatch[1].trim();
  return str;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-ai`;

export function WhaleActivityCard({ symbol, name, price }: WhaleActivityCardProps) {
  const [analysis, setAnalysis] = useState<WhaleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(true);

  const fetchWhaleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Analyze whale activity for ${symbol}` }],
          type: 'whale_analysis',
          context: { symbol, price },
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch whale data');
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        try {
          setAnalysis(JSON.parse(extractJSON(content)));
        } catch {
          setAnalysis({
            transactions: [],
            sentiment: 'neutral',
            summary: content,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, price]);

  const getSentimentStyle = (s: string) => {
    if (s === 'accumulation') return { badge: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Accumulation' };
    if (s === 'distribution') return { badge: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <TrendingDown className="w-3.5 h-3.5" />, label: 'Distribution' };
    return { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Minus className="w-3.5 h-3.5" />, label: 'Neutral' };
  };

  const getSignificanceBadge = (sig: string) => {
    if (sig === 'high') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px] h-4 px-1.5">🔥 High</Badge>;
    if (sig === 'medium') return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] h-4 px-1.5">Medium</Badge>;
    return null;
  };

  return (
    <Card className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <span className="text-lg">🐋</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Whale Activity</h3>
            <p className="text-[10px] text-muted-foreground">{symbol} large transactions</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWhaleData} disabled={isLoading} className="gap-1.5 h-8">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <div className="p-4">
        {/* Initial CTA */}
        {!analysis && !isLoading && !error && (
          <Button onClick={fetchWhaleData} className="w-full button-gradient h-10">
            <Fish className="w-4 h-4 mr-2" />
            Track Whale Movements
          </Button>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-xs text-muted-foreground">Scanning on-chain whale activity...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchWhaleData}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        )}

        {/* Results */}
        {analysis && !isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Sentiment */}
            {(() => {
              const style = getSentimentStyle(analysis.sentiment);
              return (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                  <Badge className={`${style.badge} gap-1`}>
                    {style.icon}
                    {style.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground flex-1 line-clamp-2">
                    Whales are showing <span className="text-foreground font-medium">{style.label.toLowerCase()}</span> patterns
                  </p>
                </div>
              );
            })()}

            {/* Transactions */}
            {analysis.transactions && analysis.transactions.length > 0 && (
              <Collapsible open={txOpen} onOpenChange={setTxOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Recent Transactions</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{analysis.transactions.length}</Badge>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${txOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 space-y-2">
                    {analysis.transactions.slice(0, 6).map((tx, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          tx.type === 'buy' ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            tx.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {tx.type === 'buy' ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold">
                              <span className={tx.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                                {tx.type.toUpperCase()}
                              </span>
                              {' '}{tx.amount}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {tx.exchange}{tx.timeAgo ? ` · ${tx.timeAgo}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="text-xs font-mono font-medium">{tx.value}</p>
                          {getSignificanceBadge(tx.significance)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Summary */}
            {analysis.summary && (
              <div className="p-3 rounded-lg bg-muted/10 border border-border/30">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Summary</p>
                <p className="text-sm leading-relaxed">{analysis.summary}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  );
}
