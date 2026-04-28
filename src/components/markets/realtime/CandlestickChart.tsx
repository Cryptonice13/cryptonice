import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOHLCV } from "@/hooks/useRealtimeMarket";
import { SUPPORTED_TIMEFRAMES, type ExchangeId, type Timeframe } from "@/lib/exchangeSymbols";
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/format";

interface Props {
  exchange: ExchangeId;
  symbol: string;
}

export function CandlestickChart({ exchange, symbol }: Props) {
  const [tf, setTf] = useState<Timeframe>("1h");
  const { data, isLoading, error } = useOHLCV(exchange, symbol, tf, 30000);

  // Convert OHLCV to a chart-friendly format. Each candle uses two values:
  // - "wick" (low to high) drawn via low+range
  // - "body" (open to close)
  const rows = (data ?? []).map((c) => {
    const isUp = c.c >= c.o;
    return {
      t: c.t,
      time: new Date(c.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      bodyBase: Math.min(c.o, c.c),
      bodyHeight: Math.abs(c.c - c.o) || (c.c * 0.0001),
      wickBase: c.l,
      wickHeight: c.h - c.l,
      o: c.o, h: c.h, l: c.l, c: c.c, v: c.v,
      isUp,
    };
  });

  const yMin = Math.min(...rows.map((r) => r.l), Infinity);
  const yMax = Math.max(...rows.map((r) => r.h), -Infinity);
  const pad = (yMax - yMin) * 0.05;

  return (
    <Card className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <h3 className="text-xs font-semibold">Candles · {symbol}</h3>
        <div className="flex gap-1">
          {SUPPORTED_TIMEFRAMES.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tf === t.id ? "default" : "ghost"}
              className="h-6 px-2 text-[10px]"
              onClick={() => setTf(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-[280px] sm:h-[320px] p-2">
        {error ? (
          <div className="h-full flex items-center justify-center text-xs text-destructive">{error}</div>
        ) : isLoading && rows.length === 0 ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} barCategoryGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
              <YAxis
                domain={[isFinite(yMin) ? yMin - pad : "auto", isFinite(yMax) ? yMax + pad : "auto"]}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => formatPrice(v)}
                width={70}
              />
              <Tooltip content={<CandleTooltip />} />
              {/* Wick (thin) */}
              <Bar dataKey="wickHeight" stackId="wick" fill="transparent" />
              <Bar dataKey="wickBase" stackId="wick" fill="transparent" />
              {/* Render wick + body via custom bars */}
              <Bar dataKey="bodyHeight" stackId="body" barSize={6}>
                {rows.map((r, i) => (
                  <Cell key={i} fill={r.isUp ? "hsl(142 76% 45%)" : "hsl(0 84% 60%)"} />
                ))}
              </Bar>
              <Bar dataKey="bodyBase" stackId="body" fill="transparent" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function CandleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-md border border-border/60 bg-background/90 backdrop-blur px-2 py-1.5 text-[11px] font-mono">
      <div className="text-muted-foreground">{r.time}</div>
      <div>O: {formatPrice(r.o)}</div>
      <div>H: <span className="text-green-400">{formatPrice(r.h)}</span></div>
      <div>L: <span className="text-red-400">{formatPrice(r.l)}</span></div>
      <div>C: {formatPrice(r.c)}</div>
      <div className="text-muted-foreground">V: {r.v.toFixed(2)}</div>
    </div>
  );
}
