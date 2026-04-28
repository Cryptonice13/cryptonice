import { Card } from "@/components/ui/card";
import { useTrades } from "@/hooks/useRealtimeMarket";
import { formatPrice } from "@/lib/format";
import type { ExchangeId } from "@/lib/exchangeSymbols";
import { Loader2 } from "lucide-react";

interface Props {
  exchange: ExchangeId;
  symbol: string;
}

export function TradeTape({ exchange, symbol }: Props) {
  const { data, isLoading, error } = useTrades(exchange, symbol, 3000);

  if (error) {
    return (
      <Card className="glass-card p-3">
        <p className="text-xs text-destructive">Trades error: {error}</p>
      </Card>
    );
  }

  const trades = (data ?? []).slice(0, 25);

  return (
    <Card className="glass-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-xs font-semibold">Recent Trades</h3>
        {isLoading && !data && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>
      <div className="grid grid-cols-3 gap-px text-[10px] text-muted-foreground px-3 py-1.5 border-b border-border/30">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>
      <div className="px-3 py-1 max-h-[260px] overflow-y-auto">
        {trades.map((t, i) => (
          <div key={`${t.id}-${i}`} className="grid grid-cols-3 text-[11px] font-mono py-0.5">
            <span className={t.side === "buy" ? "text-green-400" : "text-red-400"}>{formatPrice(t.price)}</span>
            <span className="text-right text-foreground/80">{t.amount.toFixed(4)}</span>
            <span className="text-right text-muted-foreground">{fmtTime(t.timestamp)}</span>
          </div>
        ))}
        {trades.length === 0 && !isLoading && (
          <p className="text-[11px] text-muted-foreground py-3 text-center">No recent trades</p>
        )}
      </div>
    </Card>
  );
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
