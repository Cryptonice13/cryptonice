import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trash2, Play, Pause, Loader2, TrendingUp } from 'lucide-react';
import { useStrategies, type TradingStrategy } from '@/hooks/useStrategies';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onBacktest: (s: TradingStrategy) => void;
}

const SAMPLE_PROMPTS = [
  'Trend-follow BTC on 1h with SMA crossover, tight stops',
  'Mean reversion on ETH 15m using RSI 14',
  'Breakout swing trade on SOL 4h',
];

export default function StrategiesTab({ onBacktest }: Props) {
  const { strategies, loading, error, generate, remove, setStatus } = useStrategies();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    const s = await generate(prompt.trim());
    setGenerating(false);
    if (s) { toast({ title: 'Strategy created', description: s.name }); setPrompt(''); }
    else toast({ title: 'Failed to generate', description: 'Check credits and try again.', variant: 'destructive' });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Strategy Generator</h3>
          <Badge variant="outline" className="text-[10px] ml-auto">3 credits</Badge>
        </div>
        <Input
          placeholder="Describe a strategy in plain English…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          disabled={generating}
        />
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.map(p => (
            <button key={p} onClick={() => setPrompt(p)}
              className="text-[11px] px-2 py-1 rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40">
              {p}
            </button>
          ))}
        </div>
        <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="w-full button-gradient">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Strategy
        </Button>
      </Card>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Your strategies ({strategies.length})</h3>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        {strategies.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground py-6 text-center">No strategies yet. Generate one above.</p>
        )}
        {strategies.map(s => (
          <Card key={s.id} className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{s.name}</span>
                  <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                  <Badge variant="outline" className="text-[10px]">{s.timeframe}</Badge>
                  {s.source === 'ai' && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">AI</Badge>}
                  <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{s.status}</Badge>
                </div>
                {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {s.assets.join(', ')} · {s.exchange} · {s.params?.indicator}
                  {s.last_backtest_score != null && (
                    <> · BT: <span className={s.last_backtest_score >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                      {s.last_backtest_score > 0 ? '+' : ''}{s.last_backtest_score.toFixed(2)}%
                    </span></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Backtest" onClick={() => onBacktest(s)}>
                  <TrendingUp className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7"
                  title={s.status === 'active' ? 'Pause' : 'Activate'}
                  onClick={() => setStatus(s.id, s.status === 'active' ? 'paused' : 'active')}>
                  {s.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete" onClick={() => remove(s.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
