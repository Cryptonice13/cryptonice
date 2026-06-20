import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, RefreshCcw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { useStrategies } from '@/hooks/useStrategies';
import { formatPrice } from '@/lib/format';

export default function PaperTradingTab() {
  const { account, positions, orders, ticking, error, runTick, resetAccount } = usePaperTrading();
  const { strategies } = useStrategies();
  const active = strategies.filter(s => s.status === 'active');

  const equity = Number(account?.equity ?? 0);
  const start = Number(account?.starting_balance ?? 0);
  const pnl = equity - start;
  const pnlPct = start ? (pnl / start) * 100 : 0;
  const profit = pnl >= 0;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">Paper Equity</div>
            <div className="text-2xl font-bold">${equity.toFixed(2)}</div>
            <div className={`text-xs flex items-center gap-1 ${profit ? 'text-emerald-500' : 'text-red-500'}`}>
              {profit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {profit ? '+' : ''}{pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-[10px] text-muted-foreground">Cash</div>
            <div className="text-sm font-mono">${Number(account?.cash_balance ?? 0).toFixed(2)}</div>
            <Badge variant="outline" className="text-[9px]">{active.length} active</Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={runTick} disabled={ticking} className="flex-1">
            <Play className="w-3.5 h-3.5 mr-1" />{ticking ? 'Ticking...' : 'Run agent tick'}
          </Button>
          <Button size="sm" variant="outline" onClick={resetAccount}>
            <RefreshCcw className="w-3.5 h-3.5 mr-1" />Reset
          </Button>
        </div>
        {error && (
          <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{error}
          </div>
        )}
        {active.length === 0 && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Activate a strategy in the Strategies tab to let the agent trade automatically.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-2">Open Positions ({positions.length})</h4>
        {positions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No open paper positions.</p>
        ) : (
          <div className="space-y-2">
            {positions.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs border-b border-border/40 pb-2 last:border-0">
                <div>
                  <div className="font-semibold">{p.symbol}</div>
                  <div className="text-[10px] text-muted-foreground">{p.exchange} · qty {Number(p.qty).toFixed(6)}</div>
                </div>
                <div className="text-right">
                  <div>Entry {formatPrice(Number(p.avg_entry))}</div>
                  <div className="text-[10px] text-muted-foreground">
                    SL {p.stop_loss ? formatPrice(Number(p.stop_loss)) : '—'} / TP {p.take_profit ? formatPrice(Number(p.take_profit)) : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-2">Recent Orders</h4>
        {orders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-auto">
            {orders.slice(0, 20).map(o => (
              <div key={o.id} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Badge variant={o.side === 'buy' ? 'default' : 'destructive'} className="text-[9px] py-0">{o.side}</Badge>
                  <span className="font-semibold">{o.symbol}</span>
                  <span className="text-muted-foreground">{o.reason}</span>
                </div>
                <div className="text-right text-muted-foreground">
                  {Number(o.qty).toFixed(4)} @ {formatPrice(Number(o.price))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
