import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Wrench, TrendingUp, TrendingDown, Activity, BarChart3, Layers, Briefcase, Newspaper, Target, Sparkles, Save, ListChecks, Power, FlaskConical, Play, Wallet, PieChart, Zap, BookOpen, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export interface ToolCall {
  name: string;
  args: any;
  result: any;
}

export const TOOL_META: Record<string, { label: string; icon: any; cost: number }> = {
  get_market_snapshot: { label: 'Market Snapshot', icon: BarChart3, cost: 1 },
  predict_price: { label: 'Price Prediction', icon: TrendingUp, cost: 2 },
  generate_trading_signal: { label: 'Trading Signal', icon: Target, cost: 2 },
  technical_analysis: { label: 'Technical Analysis', icon: Activity, cost: 2 },
  fundamental_analysis: { label: 'Fundamental Analysis', icon: Layers, cost: 2 },
  analyze_portfolio: { label: 'Portfolio Analysis', icon: Briefcase, cost: 1 },
  suggest_trade: { label: 'Trade Suggestions', icon: TrendingUp, cost: 1 },
  get_news: { label: 'Crypto News', icon: Newspaper, cost: 1 },
  // Trading agent tools
  generate_strategy: { label: 'AI Strategy', icon: Sparkles, cost: 3 },
  save_strategy: { label: 'Saved Strategy', icon: Save, cost: 0 },
  list_my_strategies: { label: 'My Strategies', icon: ListChecks, cost: 0 },
  set_strategy_status: { label: 'Strategy Status', icon: Power, cost: 0 },
  run_backtest: { label: 'Backtest', icon: FlaskConical, cost: 0 },
  run_paper_tick: { label: 'Paper Tick', icon: Play, cost: 0 },
  get_paper_state: { label: 'Paper Account', icon: Wallet, cost: 0 },
  optimize_portfolio: { label: 'Portfolio Optimizer', icon: PieChart, cost: 5 },
  scan_arbitrage: { label: 'Arbitrage Scan', icon: Zap, cost: 0 },
  evaluate_journal: { label: 'Journal Review', icon: BookOpen, cost: 3 },
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

export function renderResult(name: string, result: any) {
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

    case 'generate_strategy': {
      const s = result.strategy || result;
      if (!s?.params) return <div className="text-xs text-muted-foreground">No strategy returned.</div>;
      return (
        <div className="text-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{s.name}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{s.type} · {s.timeframe} · {s.exchange}</div>
            </div>
            <Badge variant="outline" className="text-[9px] flex-shrink-0">{s.params.indicator}</Badge>
          </div>
          {s.description && <p className="text-[11px] text-muted-foreground">{s.description}</p>}
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <div className="rounded bg-muted/30 p-1.5"><div className="text-muted-foreground text-[9px] uppercase">Stop</div><div className="text-red-500">{s.params.stopLossPct}%</div></div>
            <div className="rounded bg-muted/30 p-1.5"><div className="text-muted-foreground text-[9px] uppercase">TP</div><div className="text-emerald-500">{s.params.takeProfitPct}%</div></div>
            <div className="rounded bg-muted/30 p-1.5"><div className="text-muted-foreground text-[9px] uppercase">Size</div><div>{s.params.positionSizePct}%</div></div>
          </div>
          <div className="flex flex-wrap gap-1">
            {(s.assets || []).map((a: string) => <Badge key={a} variant="outline" className="text-[9px]">{a}</Badge>)}
          </div>
          <Button asChild size="sm" variant="outline" className="h-7 text-[11px] w-full">
            <Link to="/auto-trader?tab=strategies"><ExternalLink className="w-3 h-3 mr-1" />Open in Auto-Trader</Link>
          </Button>
        </div>
      );
    }

    case 'save_strategy': {
      const s = result.strategy;
      if (!s) return <div className="text-xs text-destructive">Save failed.</div>;
      return (
        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{s.name}</span>
            <Badge variant="outline" className="text-[9px] capitalize">{s.status}</Badge>
          </div>
          <Button asChild size="sm" variant="outline" className="h-7 text-[11px] w-full">
            <Link to={`/auto-trader?tab=strategies&strategyId=${s.id}`}><ExternalLink className="w-3 h-3 mr-1" />Open strategy</Link>
          </Button>
        </div>
      );
    }

    case 'list_my_strategies': {
      const list = result.strategies || [];
      if (!list.length) return <div className="text-xs text-muted-foreground">No strategies yet.</div>;
      return (
        <div className="text-xs space-y-1">
          {list.slice(0, 8).map((s: any) => (
            <Link key={s.id} to={`/auto-trader?tab=strategies&strategyId=${s.id}`} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0 hover:bg-muted/30 rounded px-1 -mx-1">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{s.type} · {s.timeframe} · {(s.assets || []).join(', ')}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.last_backtest_score != null && (
                  <span className={Number(s.last_backtest_score) >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {Number(s.last_backtest_score) >= 0 ? '+' : ''}{Number(s.last_backtest_score).toFixed(1)}%
                  </span>
                )}
                <Badge variant="outline" className="text-[9px] capitalize">{s.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    case 'set_strategy_status': {
      const s = result.strategy;
      if (!s) return <div className="text-xs text-destructive">{result.error || 'Update failed'}</div>;
      return (
        <div className="text-xs flex items-center justify-between">
          <span className="font-medium">{s.name}</span>
          <Badge variant="outline" className={s.status === 'active' ? 'text-emerald-500 border-emerald-500/30' : 'text-muted-foreground'}>
            {s.status}
          </Badge>
        </div>
      );
    }

    case 'run_backtest': {
      const m = result.metrics || {};
      const curve = (result.equityCurve || []).map((p: any) => ({ t: p.t, equity: p.equity }));
      return (
        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{result.symbol} · {result.timeframe} · {result.exchange}</span>
            <span className={Number(m.totalReturnPct) >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
              {Number(m.totalReturnPct) >= 0 ? '+' : ''}{Number(m.totalReturnPct ?? 0).toFixed(2)}%
            </span>
          </div>
          {curve.length > 1 && (
            <div className="h-16 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve}>
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Line type="monotone" dataKey="equity" stroke={Number(m.totalReturnPct) >= 0 ? 'hsl(var(--primary))' : '#ef4444'} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <div className="rounded bg-muted/30 p-1.5"><div className="text-muted-foreground uppercase">Trades</div><div className="text-sm font-semibold">{m.tradesCount ?? 0}</div></div>
            <div className="rounded bg-muted/30 p-1.5"><div className="text-muted-foreground uppercase">Win</div><div className="text-sm font-semibold">{Number(m.winRate ?? 0).toFixed(0)}%</div></div>
            <div className="rounded bg-muted/30 p-1.5"><div className="text-muted-foreground uppercase">Sharpe</div><div className="text-sm font-semibold">{Number(m.sharpe ?? 0).toFixed(2)}</div></div>
            <div className="rounded bg-muted/30 p-1.5"><div className="text-muted-foreground uppercase">Max DD</div><div className="text-sm font-semibold text-red-500">-{Number(m.maxDrawdownPct ?? 0).toFixed(1)}%</div></div>
          </div>
          <Button asChild size="sm" variant="outline" className="h-7 text-[11px] w-full">
            <Link to={`/auto-trader?tab=backtest${result.strategyId ? `&strategyId=${result.strategyId}` : ''}`}><ExternalLink className="w-3 h-3 mr-1" />Full backtest view</Link>
          </Button>
        </div>
      );
    }

    case 'run_paper_tick': {
      const events = result.events || [];
      return (
        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{events.length} event{events.length === 1 ? '' : 's'}</span>
            {result.equity != null && <span className="text-muted-foreground">Equity ${Number(result.equity).toFixed(2)}</span>}
          </div>
          {events.length === 0 ? (
            <div className="text-muted-foreground">No signals fired this tick.</div>
          ) : (
            <div className="space-y-1">
              {events.slice(0, 6).map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-0.5">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={e.type === 'open' ? 'text-emerald-500 border-emerald-500/30 text-[9px]' : 'text-amber-500 border-amber-500/30 text-[9px]'}>
                      {e.type}
                    </Badge>
                    <span className="font-medium">{e.symbol}</span>
                  </div>
                  {e.pnl != null ? (
                    <span className={Number(e.pnl) >= 0 ? 'text-emerald-500' : 'text-red-500'}>${Number(e.pnl).toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">{e.qty} @ ${Number(e.price).toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <Button asChild size="sm" variant="outline" className="h-7 text-[11px] w-full">
            <Link to="/auto-trader?tab=paper"><ExternalLink className="w-3 h-3 mr-1" />Paper trading dashboard</Link>
          </Button>
        </div>
      );
    }

    case 'get_paper_state': {
      const a = result.account;
      const pos = result.positions || [];
      const orders = result.recentOrders || [];
      if (!a) return <div className="text-xs text-muted-foreground">No paper account yet — run a tick to create one.</div>;
      const pnl = a.equity - a.starting;
      return (
        <div className="text-xs space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <div className="rounded bg-muted/30 p-1.5"><div className="text-[9px] text-muted-foreground uppercase">Equity</div><div className="text-sm font-semibold">${a.equity.toFixed(2)}</div></div>
            <div className="rounded bg-muted/30 p-1.5"><div className="text-[9px] text-muted-foreground uppercase">Cash</div><div className="text-sm">${a.cash.toFixed(2)}</div></div>
            <div className="rounded bg-muted/30 p-1.5"><div className="text-[9px] text-muted-foreground uppercase">PnL</div><div className={`text-sm font-semibold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</div></div>
          </div>
          {pos.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground uppercase mb-1">Open positions</div>
              {pos.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-border/20 last:border-0">
                  <span className="font-medium">{p.symbol}</span>
                  <span className="text-muted-foreground">{Number(p.qty).toFixed(4)} @ ${Number(p.avg_entry).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {orders.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground uppercase mb-1">Recent orders</div>
              {orders.slice(0, 4).map((o: any, i: number) => (
                <div key={i} className="flex justify-between text-[11px] py-0.5">
                  <span><Badge variant="outline" className={`text-[9px] mr-1 ${o.side === 'buy' ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}`}>{o.side}</Badge>{o.symbol}</span>
                  <span className="text-muted-foreground">{Number(o.qty).toFixed(4)} @ ${Number(o.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'optimize_portfolio': {
      const targets = result.targets || result.weights || result.allocations || [];
      const rationale = result.rationale || result.summary || result.analysis;
      return (
        <div className="text-xs space-y-2">
          {Array.isArray(targets) && targets.length > 0 ? (
            <div className="space-y-1">
              {targets.slice(0, 8).map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-0.5 border-b border-border/20 last:border-0">
                  <span className="font-medium">{t.symbol || t.asset || t.name}</span>
                  <div className="flex items-center gap-2 flex-1 ml-3 max-w-[60%]">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, Number(t.weight || t.weightPct || t.percentage || 0))}%` }} />
                    </div>
                    <span className="text-[11px] w-10 text-right">{Number(t.weight || t.weightPct || t.percentage || 0).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No targets returned.</div>
          )}
          {rationale && <p className="text-[11px] text-muted-foreground line-clamp-3">{String(rationale)}</p>}
          <Button asChild size="sm" variant="outline" className="h-7 text-[11px] w-full">
            <Link to="/auto-trader?tab=portfolio"><ExternalLink className="w-3 h-3 mr-1" />Open optimizer</Link>
          </Button>
        </div>
      );
    }

    case 'scan_arbitrage': {
      const ops = result.opportunities || [];
      if (!ops.length) return <div className="text-xs text-muted-foreground">No spreads above threshold right now.</div>;
      return (
        <div className="text-xs space-y-1">
          {ops.slice(0, 6).map((o: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
              <div className="min-w-0">
                <div className="font-medium">{o.symbol}</div>
                <div className="text-[10px] text-muted-foreground">{o.buy_exchange || o.buyExchange} → {o.sell_exchange || o.sellExchange}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-emerald-500 font-semibold">
                  +{Number(o.spread_pct || o.spreadPct || o.netBasisPct || 0).toFixed(2)}%
                </div>
                {(o.buy_price || o.buyPrice) && (
                  <div className="text-[10px] text-muted-foreground">${formatPrice(o.buy_price || o.buyPrice)}</div>
                )}
              </div>
            </div>
          ))}
          <Button asChild size="sm" variant="outline" className="h-7 text-[11px] w-full mt-1">
            <Link to="/auto-trader?tab=arbitrage"><ExternalLink className="w-3 h-3 mr-1" />Live arbitrage feed</Link>
          </Button>
        </div>
      );
    }

    case 'evaluate_journal': {
      const summary = result.summary || result.commentary || result.analysis;
      const suggestions = result.suggestions || result.tweaks || [];
      return (
        <div className="text-xs space-y-2">
          {summary && <p className="text-[11px]">{String(summary)}</p>}
          {Array.isArray(suggestions) && suggestions.length > 0 && (
            <ul className="list-disc list-inside text-[11px] space-y-0.5">
              {suggestions.slice(0, 5).map((s: any, i: number) => <li key={i}>{typeof s === 'string' ? s : (s.text || JSON.stringify(s))}</li>)}
            </ul>
          )}
          <Button asChild size="sm" variant="outline" className="h-7 text-[11px] w-full">
            <Link to="/auto-trader?tab=journal"><ExternalLink className="w-3 h-3 mr-1" />Open journal</Link>
          </Button>
        </div>
      );
    }

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
