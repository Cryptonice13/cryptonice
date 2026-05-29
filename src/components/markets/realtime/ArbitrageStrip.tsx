import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useArbitrage } from "@/hooks/useRealtimeMarket";
import { formatPrice } from "@/lib/format";
import { Zap } from "lucide-react";

interface Props { symbol: string }

export function ArbitrageStrip({ symbol }: Props) {
  const { data, isLoading } = useArbitrage(symbol, 10000);

  return (
    <Card className="glass-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold">Cross-Exchange Spread</h3>
        </div>
        {data && (
          <Badge variant={Math.abs(data.spreadPct) > 0.2 ? "default" : "outline"} className="text-[10px]">
            {data.spreadPct >= 0 ? "+" : ""}{data.spreadPct.toFixed(3)}%
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 @[340px]:grid-cols-3 @[480px]:grid-cols-5 gap-1.5">
        {(data?.results ?? []).map((r) => {
          const isBestBid = r.exchange === data?.bestBidExchange;
          const isBestAsk = r.exchange === data?.bestAskExchange;
          return (
            <div
              key={r.exchange}
              className={`min-w-0 rounded-md border p-1.5 text-center transition-colors ${
                isBestBid ? "border-green-500/50 bg-green-500/5"
                : isBestAsk ? "border-red-500/50 bg-red-500/5"
                : "border-border/40"
              }`}
            >
              <div className="text-[9px] uppercase text-muted-foreground truncate">{r.exchange}</div>
              {r.ok ? (
                <>
                  <div className="font-mono text-[11px] truncate">{formatPrice(r.last ?? 0)}</div>
                  {r.percentage != null && (
                    <div className={`text-[9px] truncate ${(r.percentage ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {(r.percentage ?? 0) >= 0 ? "+" : ""}{(r.percentage ?? 0).toFixed(2)}%
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[10px] text-muted-foreground">n/a</div>
              )}
            </div>
          );
        })}
        {!data && isLoading && (
          <div className="col-span-full text-[11px] text-muted-foreground text-center py-2">Comparing exchanges…</div>
        )}
      </div>

    </Card>
  );
}
