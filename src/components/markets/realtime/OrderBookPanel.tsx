import { Card } from "@/components/ui/card";
import { useOrderBook } from "@/hooks/useRealtimeMarket";
import { formatPrice } from "@/lib/format";
import type { ExchangeId } from "@/lib/exchangeSymbols";
import { Loader2 } from "lucide-react";

interface Props {
  exchange: ExchangeId;
  symbol: string;
}

export function OrderBookPanel({ exchange, symbol }: Props) {
  const { data, isLoading, error } = useOrderBook(exchange, symbol, 2000);

  if (error && !data) {
    return (
      <Card className="glass-card p-3">
        <p className="text-xs text-destructive">Orderbook unavailable: {error}</p>
      </Card>
    );
  }

  const bids = data?.bids?.slice(0, 12) ?? [];
  const asks = data?.asks?.slice(0, 12).reverse() ?? [];
  const maxBidAmt = Math.max(...bids.map((b) => b.amount), 0);
  const maxAskAmt = Math.max(...asks.map((a) => a.amount), 0);
  const spread = bids[0] && asks[asks.length - 1]
    ? asks[asks.length - 1].price - bids[0].price
    : 0;
  const spreadPct = bids[0] ? (spread / bids[0].price) * 100 : 0;

  return (
    <Card className="glass-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-xs font-semibold">Order Book</h3>
        {isLoading && !data && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid grid-cols-2 gap-px text-[10px] text-muted-foreground px-3 py-1.5 border-b border-border/30">
        <span>Price (USDT)</span>
        <span className="text-right">Amount</span>
      </div>

      {/* Asks (red, top) */}
      <div className="px-3 py-1 space-y-0.5">
        {asks.map((a, i) => (
          <Row key={`a-${i}`} price={a.price} amount={a.amount} max={maxAskAmt} side="ask" />
        ))}
      </div>

      {/* Spread */}
      <div className="px-3 py-1.5 bg-muted/30 border-y border-border/40 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Spread</span>
        <span className="font-mono">
          {formatPrice(spread)} <span className="text-muted-foreground">({spreadPct.toFixed(3)}%)</span>
        </span>
      </div>

      {/* Bids (green, bottom) */}
      <div className="px-3 py-1 space-y-0.5">
        {bids.map((b, i) => (
          <Row key={`b-${i}`} price={b.price} amount={b.amount} max={maxBidAmt} side="bid" />
        ))}
      </div>
    </Card>
  );
}

function Row({ price, amount, max, side }: { price: number; amount: number; max: number; side: "bid" | "ask" }) {
  const pct = max > 0 ? (amount / max) * 100 : 0;
  return (
    <div className="relative grid grid-cols-2 text-[11px] font-mono">
      <div
        className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-green-500/10" : "bg-red-500/10"}`}
        style={{ width: `${pct}%` }}
      />
      <span className={`relative ${side === "bid" ? "text-green-400" : "text-red-400"}`}>{formatPrice(price)}</span>
      <span className="relative text-right text-foreground/80">{amount.toFixed(4)}</span>
    </div>
  );
}
