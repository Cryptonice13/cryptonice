import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Activity } from "lucide-react";
import { useTicker } from "@/hooks/useRealtimeMarket";
import { formatPrice } from "@/lib/format";
import type { ExchangeId } from "@/lib/exchangeSymbols";
import { cn } from "@/lib/utils";

interface Props {
  exchange: ExchangeId;
  symbol: string;
}

export function LiveTickerBar({ exchange, symbol }: Props) {
  const { data, isLoading, error, lastUpdated } = useTicker(exchange, symbol, 3000);
  const prevPrice = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!data?.last) return;
    if (prevPrice.current != null && data.last !== prevPrice.current) {
      setFlash(data.last > prevPrice.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(t);
    }
    prevPrice.current = data.last;
  }, [data?.last]);

  // Only show full error card when we have NO data at all.
  if (error && !data) {
    return (
      <Card className="glass-card p-3 border-destructive/30">
        <p className="text-xs text-destructive">Ticker unavailable: {error}</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2 min-w-[120px]">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{symbol}</span>
          <Badge variant="outline" className="text-[10px] uppercase">{exchange}</Badge>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-mono text-lg sm:text-xl font-bold transition-colors",
              flash === "up" && "text-green-400",
              flash === "down" && "text-red-400",
            )}
          >
            {data?.last != null ? formatPrice(data.last) : "—"}
          </span>
          {data?.percentage != null && (
            <span className={cn("text-xs font-medium", data.percentage >= 0 ? "text-green-400" : "text-red-400")}>
              {data.percentage >= 0 ? "+" : ""}{data.percentage.toFixed(2)}%
            </span>
          )}
        </div>

        <Stat label="Bid" value={data?.bid} positive />
        <Stat label="Ask" value={data?.ask} negative />
        <Stat label="24h High" value={data?.high} />
        <Stat label="24h Low" value={data?.low} />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase">24h Vol</span>
          <span className="text-xs font-mono">
            {data?.quoteVolume ? `$${(data.quoteVolume / 1e6).toFixed(1)}M` : "—"}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", error ? "bg-amber-500" : "bg-green-500")} />
          {isLoading && !data
            ? "loading…"
            : error
              ? "reconnecting…"
              : lastUpdated ? `updated ${secondsAgo(lastUpdated)}s ago` : ""}
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, positive, negative }: { label: string; value?: number; positive?: boolean; negative?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
        {positive && <ArrowUp className="w-3 h-3 text-green-400" />}
        {negative && <ArrowDown className="w-3 h-3 text-red-400" />}
        {label}
      </span>
      <span className="text-xs font-mono">{value != null ? formatPrice(value) : "—"}</span>
    </div>
  );
}

function secondsAgo(d: Date) { return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000)); }
