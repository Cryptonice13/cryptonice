import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { formatPrice } from '@/lib/format';

export default function JournalTab() {
  const { trades } = usePaperTrading();

  const stats = useMemo(() => {
    if (!trades.length) return null;
    const wins = trades.filter(t => Number(t.pnl) > 0).length;
    const totalPnl = trades.reduce((a, t) => a + Number(t.pnl), 0);
    const grossWin = trades.filter(t => Number(t.pnl) > 0).reduce((a, t) => a + Number(t.pnl), 0);
    const grossLoss = Math.abs(trades.filter(t => Number(t.pnl) < 0).reduce((a, t) => a + Number(t.pnl), 0));
    const pf = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    return {
      count: trades.length,
      winRate: (wins / trades.length) * 100,
      totalPnl,
      profitFactor: Number.isFinite(pf) ? pf : null,
    };
  }, [trades]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Trade Journal & Analytics</h3>
        </div>
        {stats ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Trades" value={String(stats.count)} />
            <Stat label="Win rate" value={`${stats.winRate.toFixed(1)}%`} />
            <Stat label="Total PnL" value={`$${stats.totalPnl.toFixed(2)}`} positive={stats.totalPnl >= 0} />
            <Stat label="Profit Factor" value={stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : '—'} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No closed trades yet.</p>
        )}
      </Card>

      <Card className="p-3">
        {trades.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Closed trades will appear here.</p>
        ) : (
          <div className="space-y-2 max-h-[460px] overflow-auto">
            {trades.map(t => {
              const win = Number(t.pnl) >= 0;
              return (
                <div key={t.id} className="border-b border-border/40 pb-2 last:border-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.symbol}</span>
                      <Badge variant="outline" className="text-[9px]">{t.reason_close}</Badge>
                    </div>
                    <div className={win ? 'text-emerald-500' : 'text-red-500'}>
                      {win ? '+' : ''}${Number(t.pnl).toFixed(2)} ({Number(t.pnl_pct).toFixed(2)}%)
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>Entry {formatPrice(Number(t.entry_price))} → Exit {formatPrice(Number(t.exit_price))}</span>
                    <span>{new Date(t.closed_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${positive === undefined ? '' : positive ? 'text-emerald-500' : 'text-red-500'}`}>{value}</div>
    </div>
  );
}
