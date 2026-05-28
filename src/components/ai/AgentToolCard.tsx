import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, TrendingUp, TrendingDown, Activity, BarChart3, Layers, Briefcase, Newspaper, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/format';

export interface ToolCall {
  name: string;
  args: any;
  result: any;
}

const TOOL_META: Record<string, { label: string; icon: any; cost: number }> = {
  get_market_snapshot: { label: 'Market Snapshot', icon: BarChart3, cost: 1 },
  predict_price: { label: 'Price Prediction', icon: TrendingUp, cost: 2 },
  generate_trading_signal: { label: 'Trading Signal', icon: Target, cost: 2 },
  technical_analysis: { label: 'Technical Analysis', icon: Activity, cost: 2 },
  fundamental_analysis: { label: 'Fundamental Analysis', icon: Layers, cost: 2 },
  analyze_portfolio: { label: 'Portfolio Analysis', icon: Briefcase, cost: 1 },
  suggest_trade: { label: 'Trade Suggestions', icon: TrendingUp, cost: 1 },
  get_news: { label: 'Crypto News', icon: Newspaper, cost: 1 },
};

function fmtPct(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const color = n >= 0 ? 'text-emerald-500' : 'text-red-500';
  const sign = n >= 0 ? '+' : '';
  return <span className={color}>{sign}{n.toFixed(2)}%</span>;
}

function SignalBadge({ signal }: { signal: string }) {
  const c =
    signal === 'BUY' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' :
    signal === 'SELL' ? 'bg-red-500/15 text-red-500 border-red-500/30' :
    'bg-amber-500/15 text-amber-500 border-amber-500/30';
  return <Badge variant="outline" className={c}>{signal}</Badge>;
}

function renderResult(name: string, result: any) {
  if (!result || result.error) {
    return <div className="text-xs text-destructive">{result?.error || 'No result'}</div>;
  }

  switch (name) {
    case 'get_market_snapshot':
      return (
        <div className="space-y-1">
          {(result.assets || []).map((a: any) => (
            <div key={a.symbol} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-0">
              <div className="font-medium">{a.symbol} <span className="text-muted-foreground">· {a.name}</span></div>
              <div className="flex items-center gap-3">
                <span>${formatPrice(a.price)}</span>
                {fmtPct(a.change24h)}
              </div>
            </div>
          ))}
        </div>
      );

    case 'predict_price':
      return (
        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{result.symbol} @ ${formatPrice(result.price)}</span>
            <Badge variant="outline" className={result.sentiment === 'bullish' ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}>
              {result.sentiment}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Short term</div>
              <div>${formatPrice(result.shortTerm?.target)} <span className="text-muted-foreground">· {result.shortTerm?.direction}</span></div>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Medium term</div>
              <div>${formatPrice(result.mediumTerm?.target)} <span className="text-muted-foreground">· {result.mediumTerm?.direction}</span></div>
            </div>
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="text-muted-foreground">Support:</span>
            {(result.supportLevels || []).map((s: number, i: number) => <span key={i}>${formatPrice(s)}</span>)}
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="text-muted-foreground">Resistance:</span>
            {(result.resistanceLevels || []).map((s: number, i: number) => <span key={i}>${formatPrice(s)}</span>)}
          </div>
        </div>
      );

    case 'generate_trading_signal':
      return (
        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{result.symbol} @ ${formatPrice(result.price)}</span>
            <SignalBadge signal={result.signal} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Entry</div>
              <div>${formatPrice(result.entryRange?.min)} – ${formatPrice(result.entryRange?.max)}</div>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Stop Loss</div>
              <div className="text-red-500">${formatPrice(result.stopLoss)}</div>
            </div>
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <div className="text-[10px] text-muted-foreground uppercase mb-1">Take Profits</div>
            <div className="flex gap-2 flex-wrap">
              {(result.takeProfits || []).map((tp: number, i: number) => (
                <span key={i} className="text-emerald-500">TP{i + 1}: ${formatPrice(tp)}</span>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>R:R {result.riskReward}</span>
            <span>Strength {result.strength}/10</span>
            <span>{result.timeframe}</span>
          </div>
        </div>
      );

    case 'technical_analysis':
      return (
        <div className="text-xs space-y-2">
          <div className="font-semibold">{result.symbol} @ ${formatPrice(result.price)}</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase">RSI</div>
              <div>{result.indicators?.rsi} <span className="text-muted-foreground">{result.indicators?.rsiSignal}</span></div>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase">MACD</div>
              <div>{result.indicators?.macdSignal}</div>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Trend</div>
              <div>{result.trend}</div>
            </div>
          </div>
          {result.indicators?.sma7 != null && (
            <div className="text-[11px] text-muted-foreground">
              7d SMA: ${formatPrice(result.indicators.sma7)} ({fmtPct(result.indicators.priceVsSma7Pct)} vs price)
            </div>
          )}
        </div>
      );

    case 'fundamental_analysis':
      return (
        <div className="text-xs space-y-1">
          <div className="font-semibold">{result.name} ({result.symbol}) — Rank #{result.marketCapRank ?? '—'}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
            <div>Market Cap: <span className="text-foreground">${(result.marketCap / 1e9).toFixed(2)}B</span></div>
            <div>24h Vol: <span className="text-foreground">${(result.volume24h / 1e9).toFixed(2)}B</span></div>
            <div>ATH: <span className="text-foreground">${formatPrice(result.ath)} ({fmtPct(result.athChangePct)})</span></div>
            <div>Supply: <span className="text-foreground">{result.circulatingSupply?.toLocaleString() ?? '—'}</span></div>
          </div>
          {result.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-3">{result.description}</p>
          )}
        </div>
      );

    case 'analyze_portfolio':
      return (
        <div className="text-xs space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">Total: ${result.totalValueUsd?.toLocaleString()}</span>
            <Badge variant="outline" className={
              result.riskLevel === 'high' ? 'text-red-500 border-red-500/30' :
              result.riskLevel === 'medium' ? 'text-amber-500 border-amber-500/30' :
              'text-emerald-500 border-emerald-500/30'
            }>{result.riskLevel} risk</Badge>
          </div>
          <div className="space-y-1">
            {(result.breakdown || []).slice(0, 5).map((h: any) => (
              <div key={h.symbol} className="flex justify-between text-[11px]">
                <span>{h.symbol}</span>
                <span>${h.value?.toLocaleString()} · {h.allocationPct}%</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'suggest_trade':
      return (
        <div className="text-xs space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Top {result.direction} picks</div>
          {(result.picks || []).map((p: any) => (
            <div key={p.symbol} className="flex justify-between border-b border-border/20 last:border-0 py-1">
              <span className="font-medium">{p.symbol}</span>
              <span>${formatPrice(p.price)} {fmtPct(p.change7d)}</span>
            </div>
          ))}
        </div>
      );

    case 'get_news':
      return (
        <ul className="text-xs space-y-1 list-disc list-inside">
          {(result.headlines || []).map((h: string, i: number) => <li key={i}>{h}</li>)}
        </ul>
      );

    default:
      return <pre className="text-[10px] overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>;
  }
}

export function AgentToolCard({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false);
  const meta = TOOL_META[call.name] || { label: call.name, icon: Wrench, cost: 1 };
  const Icon = meta.icon;

  return (
    <Card className="bg-muted/20 border-border/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-medium truncate">{meta.label}</span>
          {call.args?.symbol && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{String(call.args.symbol).toUpperCase()}</Badge>
          )}
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-border/30">
          {renderResult(call.name, call.result)}
        </div>
      )}
    </Card>
  );
}
