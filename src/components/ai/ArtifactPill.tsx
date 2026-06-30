import { ArrowUpRight, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TOOL_META } from './AgentToolCard';
import type { ToolCall } from './AgentToolCard';

function previewLine(call: ToolCall): string | null {
  const r = call.result;
  if (!r) return null;
  if (r.error) return `Error: ${String(r.error).slice(0, 60)}`;
  switch (call.name) {
    case 'get_market_snapshot':
      return `${(r.assets || []).length} assets`;
    case 'predict_price':
      return `${r.symbol} → ${r.sentiment} · ${r.shortTerm?.direction ?? ''}`;
    case 'generate_trading_signal':
      return `${r.symbol} · ${r.signal} · R:R ${r.riskReward ?? '—'}`;
    case 'technical_analysis':
      return `${r.symbol} · ${r.trend ?? ''} · RSI ${r.indicators?.rsi ?? '—'}`;
    case 'fundamental_analysis':
      return `${r.name ?? r.symbol} · Rank #${r.marketCapRank ?? '—'}`;
    case 'analyze_portfolio':
      return `Total $${Number(r.totalValueUsd ?? 0).toLocaleString()} · ${r.riskLevel ?? ''}`;
    case 'suggest_trade':
      return `${(r.picks || []).length} ${r.direction ?? ''} picks`;
    case 'get_news':
      return `${(r.headlines || []).length} headlines`;
    case 'generate_strategy':
      return r.strategy?.name || 'Strategy generated';
    case 'run_backtest': {
      const ret = r.metrics?.totalReturnPct;
      return `${r.symbol ?? ''} · ${ret != null ? (Number(ret) >= 0 ? '+' : '') + Number(ret).toFixed(1) + '%' : 'Backtest'}`;
    }
    case 'run_paper_tick':
      return `${(r.events || []).length} events · equity $${Number(r.equity ?? 0).toFixed(0)}`;
    case 'get_paper_state':
      return r.account ? `Equity $${Number(r.account.equity).toFixed(0)}` : 'No account';
    case 'optimize_portfolio':
      return `${(r.targets || r.weights || r.allocations || []).length} allocations`;
    case 'scan_arbitrage':
      return `${(r.opportunities || []).length} spreads`;
    case 'list_my_strategies':
      return `${(r.strategies || []).length} strategies`;
    default:
      return null;
  }
}

export function ArtifactPill({ call, onOpen, index }: { call: ToolCall; onOpen: () => void; index?: number }) {
  const meta = TOOL_META[call.name] || { label: call.name, icon: Wrench, cost: 0 };
  const Icon = meta.icon;
  const preview = previewLine(call);
  const symbol = call.args?.symbol ? String(call.args.symbol).toUpperCase() : null;
  const isError = call.result?.error;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/30 hover:from-muted/30 hover:to-muted/50 hover:border-primary/40 transition-all p-3 flex items-center gap-3 shadow-sm hover:shadow-md"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          {typeof index === 'number' && (
            <span className="text-[9px] font-mono text-muted-foreground">#{index + 1}</span>
          )}
          <span className="text-xs font-semibold truncate">{meta.label}</span>
          {symbol && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{symbol}</Badge>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {preview || 'Click to view artifact'}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary flex-shrink-0">
        <span className="hidden sm:inline">Open</span>
        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </button>
  );
}
