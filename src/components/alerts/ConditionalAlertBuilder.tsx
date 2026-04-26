import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Plus, Pause, Play, Trash2, AlertTriangle, CheckCircle2, RotateCcw, Bell, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useConditionalAlerts, type ConditionRule } from '@/hooks/useConditionalAlerts';

const EXAMPLES = [
  'Alert me when BTC drops below 90k AND volume spikes 2x',
  'ETH breaks above 4500 with strong momentum',
  'SOL drops more than 8% in 24h',
  'Notify me if BTC and ETH both fall over 5% today',
];

const METRIC_LABELS: Record<string, string> = {
  price: 'Price',
  price_change_24h_pct: '24h Change %',
  price_change_7d_pct: '7d Change %',
  volume_24h: '24h Volume',
  volume_ratio_24h: 'Volume Spike',
  market_cap: 'Market Cap',
};

const OP_LABELS: Record<string, string> = { gt: '>', lt: '<', gte: '≥', lte: '≤' };

function ConditionPill({ c }: { c: ConditionRule }) {
  const isPct = c.metric.includes('pct');
  const isVolume = c.metric.includes('volume');
  return (
    <Badge variant="outline" className="text-[10px] h-5 font-mono gap-0.5">
      <span className="font-semibold">{c.asset_symbol}</span>
      <span className="text-muted-foreground">{METRIC_LABELS[c.metric] || c.metric}</span>
      <span className="text-primary">{OP_LABELS[c.operator] || c.operator}</span>
      <span>{isPct ? `${c.value}%` : isVolume ? `${c.value}x` : c.value.toLocaleString()}</span>
    </Badge>
  );
}

export function ConditionalAlertBuilder() {
  const { alerts, isParsing, parsePrompt, createAlert, togglePause, deleteAlert, resetTriggered } = useConditionalAlerts();
  const [prompt, setPrompt] = useState('');
  const [parsed, setParsed] = useState<{ name: string; logic: 'AND' | 'OR'; conditions: ConditionRule[] } | null>(null);
  const [creating, setCreating] = useState(false);

  const handleParse = async () => {
    setParsed(null);
    const result = await parsePrompt(prompt);
    if (result) setParsed(result);
  };

  const handleCreate = async () => {
    if (!parsed) return;
    setCreating(true);
    const result = await createAlert(parsed, prompt);
    setCreating(false);
    if (result) {
      setPrompt('');
      setParsed(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Builder */}
      <Card className="glass-card overflow-hidden">
        <div className="p-3 border-b border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                AI Conditional Alerts
                <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">2 credits</Badge>
              </h3>
              <p className="text-[10px] text-muted-foreground">Multi-factor alerts in plain English. Evaluated every 5 minutes — never miss a move while sleeping.</p>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-3">
          <div className="space-y-2">
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the conditions in plain English..."
              rows={2}
              className="text-sm resize-none"
            />
            <div className="flex flex-wrap gap-1">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {!parsed ? (
            <Button
              onClick={handleParse}
              disabled={!prompt.trim() || isParsing}
              size="sm"
              className="w-full"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Parse with AI
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">{parsed.name}</p>
                <Badge variant="outline" className="text-[10px] h-5">{parsed.logic}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsed.conditions.map((c, i) => (
                  <ConditionPill key={i} c={c} />
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleCreate} disabled={creating} size="sm" className="flex-1 button-gradient h-8 text-xs">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                  Create Alert
                </Button>
                <Button onClick={() => setParsed(null)} variant="ghost" size="sm" className="h-8 text-xs">
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Alerts ({alerts.length})</h3>
        </div>
        <AnimatePresence>
          {alerts.length === 0 ? (
            <Card className="glass-card p-6 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No conditional alerts yet</p>
              <p className="text-[11px] text-muted-foreground mt-1">Create one above — let AI watch the market while you sleep.</p>
            </Card>
          ) : alerts.map(a => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={`glass-card p-3 ${a.status === 'triggered' ? 'border-yellow-500/40 bg-yellow-500/5' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate">{a.name}</p>
                      {a.status === 'active' && <Badge variant="outline" className="text-[9px] h-4 px-1 border-green-500/40 text-green-400"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Active</Badge>}
                      {a.status === 'paused' && <Badge variant="outline" className="text-[9px] h-4 px-1 border-muted-foreground/40">Paused</Badge>}
                      {a.status === 'triggered' && <Badge className="text-[9px] h-4 px-1 bg-yellow-500/20 text-yellow-400"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Triggered!</Badge>}
                      <Badge variant="outline" className="text-[9px] h-4 px-1">{a.logic}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">"{a.natural_language}"</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {a.status === 'triggered' ? (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resetTriggered(a.id)} title="Reactivate">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePause(a.id, a.status)}>
                        {a.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteAlert(a.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(a.conditions || []).map((c, i) => <ConditionPill key={i} c={c} />)}
                </div>
                {a.last_evaluated_at && (
                  <p className="text-[9px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Last checked: {new Date(a.last_evaluated_at).toLocaleString()}
                  </p>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
