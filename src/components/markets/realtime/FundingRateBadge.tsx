import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFunding } from "@/hooks/useRealtimeMarket";
import { Clock, Percent } from "lucide-react";

interface Props { symbol: string }

export function FundingRateBadge({ symbol }: Props) {
  const { data, error } = useFunding(symbol, 60000);

  if (error) return null;
  if (!data) {
    return (
      <Card className="glass-card p-3">
        <p className="text-xs text-muted-foreground">Loading funding rate…</p>
      </Card>
    );
  }

  const ratePct = (data.fundingRate ?? 0) * 100;
  const positive = ratePct >= 0;
  const nextMin = data.nextFundingTimestamp
    ? Math.max(0, Math.round((data.nextFundingTimestamp - Date.now()) / 60000))
    : null;

  return (
    <Card className="glass-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">Funding Rate</span>
          <Badge variant="outline" className="text-[10px] uppercase">{data.exchange}</Badge>
        </div>
        <span className={`font-mono text-sm ${positive ? "text-green-400" : "text-red-400"}`}>
          {positive ? "+" : ""}{ratePct.toFixed(4)}%
        </span>
      </div>
      {nextMin != null && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          Next funding in {nextMin >= 60 ? `${Math.floor(nextMin / 60)}h ${nextMin % 60}m` : `${nextMin}m`}
        </div>
      )}
    </Card>
  );
}
