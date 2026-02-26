import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Fish, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

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

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-ai`;

export function WhaleActivityCard({ symbol, name, price }: WhaleActivityCardProps) {
  const [analysis, setAnalysis] = useState<WhaleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWhaleData = useCallback(async () => {
    setIsLoading(true);
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

      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        try {
          setAnalysis(JSON.parse(content));
        } catch {
          setAnalysis({
            transactions: [],
            sentiment: 'neutral',
            summary: content,
          });
        }
      }
    } catch (err) {
      console.error('Whale analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, price]);

  return (
    <Card className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Fish className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Whale Activity</h3>
            <p className="text-[10px] text-muted-foreground">{symbol} large transactions</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={fetchWhaleData}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {!analysis && !isLoading && (
        <Button onClick={fetchWhaleData} variant="outline" size="sm" className="w-full text-xs h-8">
          <Fish className="w-3.5 h-3.5 mr-1.5" />
          Analyze Whale Movements
        </Button>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      {analysis && (
        <>
          {/* Sentiment badge */}
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] ${
              analysis.sentiment === 'accumulation'
                ? 'bg-green-500/20 text-green-400'
                : analysis.sentiment === 'distribution'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
            </Badge>
            <p className="text-[10px] text-muted-foreground flex-1 truncate">{analysis.summary}</p>
          </div>

          {/* Transactions */}
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {analysis.transactions?.slice(0, 5).map((tx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    tx.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {tx.type === 'buy' ? (
                      <ArrowDownRight className="w-3 h-3 text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{tx.amount}</p>
                    <p className="text-[9px] text-muted-foreground">{tx.exchange} · {tx.timeAgo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono">{tx.value}</p>
                  {tx.significance === 'high' && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 text-[8px] h-3.5 px-1">Big</Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
