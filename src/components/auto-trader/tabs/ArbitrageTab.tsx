import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Zap } from 'lucide-react';
import { useArbitrage } from '@/hooks/useArbitrage';
import { formatPrice } from '@/lib/format';

export default function ArbitrageTab() {
  const { opps, scanning, error, scan } = useArbitrage();

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Cross-Exchange Arbitrage</h3>
          <Badge variant="outline" className="ml-auto text-[10px]">Free</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Live spreads across Binance, Coinbase, Kraken, Bybit, OKX. Net edge assumes 10 bps taker per leg.
        </p>
        <Button size="sm" className="w-full" onClick={scan} disabled={scanning}>
          <RefreshCcw className={`w-3.5 h-3.5 mr-1 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan now'}
        </Button>
        {error && <div className="text-xs text-red-500">{error}</div>}
      </Card>

      <Card className="p-3">
        {opps.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No opportunities yet. Click "Scan now".
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {opps.map(o => (
              <div key={o.id} className="border-b border-border/40 pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{o.symbol}</div>
                  <Badge variant={o.est_net_bps > 0 ? 'default' : 'secondary'} className="text-[10px]">
                    {o.est_net_bps > 0 ? '+' : ''}{o.est_net_bps.toFixed(1)} bps net
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center justify-between mt-1">
                  <span>Buy <span className="text-emerald-500">{o.exchange_a}</span> @ {formatPrice(Number(o.price_a))}</span>
                  <span>Sell <span className="text-red-500">{o.exchange_b}</span> @ {formatPrice(Number(o.price_b))}</span>
                </div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Spread {o.spread_bps.toFixed(1)} bps · {new Date(o.detected_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
