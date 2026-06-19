import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useBacktest } from '@/hooks/useBacktest';
import { useStrategies, type TradingStrategy } from '@/hooks/useStrategies';

interface Props { initialStrategy?: TradingStrategy | null; }

export default function BacktestTab({ initialStrategy }: Props) {
  const { strategies } = useStrategies();
  const { result, loading, error, run } = useBacktest();
  const [strategyId, setStrategyId] = useState<string>('');
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [exchange, setExchange] = useState('binance');
  const [candleLimit, setCandleLimit] = useState(500);

  useEffect(() => {
    if (initialStrategy) {
      setStrategyId(initialStrategy.id);
      setSymbol(initialStrategy.assets[0] || 'BTC/USDT');
      setTimeframe(initialStrategy.timeframe);
      setExchange(initialStrategy.exchange);
    }
  }, [initialStrategy]);

  const strategy = useMemo(() => strategies.find(s => s.id === strategyId) || null, [strategies, strategyId]);

  const handleRun = async () => {
    if (!strategy) return;
    await run({
      strategyId: strategy.id,
      symbol, exchange, timeframe,
      params: strategy.params,
      limit: candleLimit,
    });
  };

  const chartData = useMemo(() => (result?.equityCurve || []).map(p => ({
    t: new Date(p.t).toLocaleDateString(),
    equity: Math.round(p.equity * 100) / 100,
  })), [result]);

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Backtest configuration</h3>
        <div className="grid grid-cols-2 gap-2">
          <select className="bg-background border border-border rounded-md text-xs px-2 h-9 col-span-2"
            value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
            <option value="">Select strategy…</option>
            {strategies.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
          </select>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="BTC/USDT" className="h-9 text-xs" />
          <select className="bg-background border border-border rounded-md text-xs px-2 h-9" value={exchange} onChange={(e) => setExchange(e.target.value)}>
            <option value="binance">Binance</option><option value="bybit">Bybit</option>
            <option value="coinbase">Coinbase</option><option value="kraken">Kraken</option><option value="okx">OKX</option>
          </select>
          <select className="bg-background border border-border rounded-md text-xs px-2 h-9" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            {['5m','15m','1h','4h','1d'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Input type="number" value={candleLimit} min={50} max={1000}
            onChange={(e) => setCandleLimit(Number(e.target.value) || 500)} placeholder="Candles" className="h-9 text-xs" />
        </div>
        <Button onClick={handleRun} disabled={!strategy || loading} className="w-full button-gradient">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Run backtest
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </Card>

      {result && (
        <>
          <Card className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <Metric label="Return" value={`${result.metrics.totalReturnPct > 0 ? '+' : ''}${result.metrics.totalReturnPct}%`} positive={result.metrics.totalReturnPct >= 0} />
              <Metric label="Trades" value={String(result.metrics.tradesCount)} />
              <Metric label="Win rate" value={`${result.metrics.winRate}%`} />
              <Metric label="Sharpe" value={String(result.metrics.sharpe)} />
              <Metric label="Max DD" value={`-${result.metrics.maxDrawdownPct}%`} positive={false} />
              <Metric label="Profit factor" value={result.metrics.profitFactor != null ? String(result.metrics.profitFactor) : '–'} />
              <Metric label="Final equity" value={`$${result.metrics.finalEquity.toLocaleString()}`} />
              <Metric label="Candles" value={String(result.candlesCount)} />
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Equity curve</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['auto','auto']} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" fill="url(#eq)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {result.trades.length > 0 && (
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Last {result.trades.length} trades</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="text-muted-foreground">
                    <tr><th className="text-left p-1">Entry</th><th className="text-left p-1">Exit</th><th className="text-right p-1">PnL %</th><th className="text-left p-1">Reason</th></tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(-50).reverse().map((t, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="p-1">${t.entryPrice.toFixed(2)}</td>
                        <td className="p-1">${t.exitPrice.toFixed(2)}</td>
                        <td className={`p-1 text-right ${t.pnlPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{t.pnlPct.toFixed(2)}%</td>
                        <td className="p-1 text-muted-foreground">{t.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${positive === true ? 'text-emerald-500' : positive === false ? 'text-red-500' : ''}`}>{value}</p>
    </div>
  );
}
