import { Card } from "@/components/ui/card";
import { useOrderBook } from "@/hooks/useRealtimeMarket";
import { formatPrice } from "@/lib/format";
import type { ExchangeId } from "@/lib/exchangeSymbols";
import { Loader2, ArrowDown, ArrowUp } from "lucide-react";
import { useMemo } from "react";

interface Props {
  exchange: ExchangeId;
  symbol: string;
}

const ROWS = 12;

export function OrderBookPanel({ exchange, symbol }: Props) {
  const { data, isLoading, error } = useOrderBook(exchange, symbol, 2000);

  const { bids, asks, maxTotal, spread, spreadPct, mid, midDir } = useMemo(() => {
    const rawBids = data?.bids?.slice(0, ROWS) ?? [];
    const rawAsks = data?.asks?.slice(0, ROWS) ?? [];

    // Compute cumulative totals (depth)
    let cumB = 0;
    const bids = rawBids.map((b) => {
      cumB += b.amount;
      return { ...b, total: cumB };
    });
    let cumA = 0;
    const asksAsc = rawAsks.map((a) => {
      cumA += a.amount;
      return { ...a, total: cumA };
    });
    // Display asks from highest -> lowest (so lowest sits next to spread)
    const asks = [...asksAsc].reverse();

    const maxTotal = Math.max(cumA, cumB, 0);
    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asksAsc[0]?.price ?? 0;
    const spread = bestBid && bestAsk ? bestAsk - bestBid : 0;
    const spreadPct = bestBid ? (spread / bestBid) * 100 : 0;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk || 0;
    const midDir = bestBid > bestAsk ? "up" : "down";

    return { bids, asks, maxTotal, spread, spreadPct, mid, midDir };
  }, [data]);

  if (error && !data) {
    return (
      <Card className="glass-card p-3">
        <p className="text-xs text-destructive">Orderbook unavailable: {error}</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide">Order Book</h3>
        {isLoading && !data ? (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-[10px] text-muted-foreground font-mono">{symbol}</span>
        )}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 px-3 py-1.5 border-b border-border/30 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (red, top — highest first, lowest closest to spread) */}
      <div className="px-1.5 py-1 space-y-px">
        {asks.map((a, i) => (
          <Row
            key={`a-${i}`}
            price={a.price}
            amount={a.amount}
            total={a.total}
            max={maxTotal}
            side="ask"
          />
        ))}
        {asks.length === 0 &&
          Array.from({ length: ROWS }).map((_, i) => (
            <SkeletonRow key={`as-${i}`} side="ask" />
          ))}
      </div>

      {/* Spread / mid */}
      <div className="px-3 py-2 bg-muted/40 border-y border-border/40 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          {midDir === "up" ? (
            <ArrowUp className="w-3 h-3 text-green-400" />
          ) : (
            <ArrowDown className="w-3 h-3 text-red-400" />
          )}
          <span className="font-mono font-semibold">{formatPrice(mid)}</span>
        </div>
        <div className="text-muted-foreground font-mono text-[10px]">
          Spread {formatPrice(spread)} ({spreadPct.toFixed(3)}%)
        </div>
      </div>

      {/* Bids (green, bottom) */}
      <div className="px-1.5 py-1 space-y-px">
        {bids.map((b, i) => (
          <Row
            key={`b-${i}`}
            price={b.price}
            amount={b.amount}
            total={b.total}
            max={maxTotal}
            side="bid"
          />
        ))}
        {bids.length === 0 &&
          Array.from({ length: ROWS }).map((_, i) => (
            <SkeletonRow key={`bs-${i}`} side="bid" />
          ))}
      </div>
    </Card>
  );
}

function Row({
  price,
  amount,
  total,
  max,
  side,
}: {
  price: number;
  amount: number;
  total: number;
  max: number;
  side: "bid" | "ask";
}) {
  const pct = max > 0 ? Math.min((total / max) * 100, 100) : 0;
  return (
    <div className="relative grid grid-cols-[1.2fr_1fr_1fr] gap-2 px-1.5 py-[3px] text-[11px] font-mono leading-tight rounded-sm hover:bg-muted/40 transition-colors">
      {/* depth bar */}
      <div
        className={`absolute inset-y-0 right-0 rounded-sm ${
          side === "bid" ? "bg-green-500/15" : "bg-red-500/15"
        }`}
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <span
        className={`relative truncate ${
          side === "bid" ? "text-green-400" : "text-red-400"
        }`}
      >
        {formatPrice(price)}
      </span>
      <span className="relative text-right text-foreground/85 tabular-nums">
        {amount.toFixed(4)}
      </span>
      <span className="relative text-right text-muted-foreground tabular-nums">
        {total.toFixed(4)}
      </span>
    </div>
  );
}

function SkeletonRow({ side }: { side: "bid" | "ask" }) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 px-1.5 py-[3px] text-[11px]">
      <span
        className={`h-3 rounded ${side === "bid" ? "bg-green-500/10" : "bg-red-500/10"}`}
      />
      <span className="h-3 rounded bg-muted/40" />
      <span className="h-3 rounded bg-muted/30" />
    </div>
  );
}
