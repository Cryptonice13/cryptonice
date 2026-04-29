import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOHLCV } from "@/hooks/useRealtimeMarket";
import { SUPPORTED_TIMEFRAMES, type ExchangeId, type Timeframe } from "@/lib/exchangeSymbols";
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/format";

interface Props {
  exchange: ExchangeId;
  symbol: string;
}

const UP = "hsl(142 76% 45%)";
const DOWN = "hsl(0 84% 60%)";

export function CandlestickChart({ exchange, symbol }: Props) {
  const [tf, setTf] = useState<Timeframe>("1h");
  const { data, isLoading, error } = useOHLCV(exchange, symbol, tf, 30000);
  const [hover, setHover] = useState<number | null>(null);

  const candles = data ?? [];

  const { yMin, yMax } = useMemo(() => {
    if (!candles.length) return { yMin: 0, yMax: 0 };
    let lo = Infinity, hi = -Infinity;
    for (const c of candles) {
      if (c.l < lo) lo = c.l;
      if (c.h > hi) hi = c.h;
    }
    const pad = (hi - lo) * 0.08 || hi * 0.001;
    return { yMin: lo - pad, yMax: hi + pad };
  }, [candles]);

  // Layout
  const W = 800;
  const H = 300;
  const PAD_L = 64;
  const PAD_R = 12;
  const PAD_T = 10;
  const PAD_B = 26;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const xFor = (i: number) => PAD_L + (innerW / Math.max(candles.length, 1)) * (i + 0.5);
  const yFor = (v: number) =>
    PAD_T + innerH - ((v - yMin) / Math.max(yMax - yMin, 1e-9)) * innerH;

  const candleW = candles.length ? Math.max(2, (innerW / candles.length) * 0.7) : 6;

  // Y-axis ticks
  const yTicks = useMemo(() => {
    if (!candles.length) return [];
    const n = 5;
    const step = (yMax - yMin) / (n - 1);
    return Array.from({ length: n }, (_, i) => yMin + step * i);
  }, [yMin, yMax, candles.length]);

  // X-axis ticks (~6 labels)
  const xTicks = useMemo(() => {
    if (!candles.length) return [] as { i: number; label: string }[];
    const want = 6;
    const step = Math.max(1, Math.floor(candles.length / want));
    const out: { i: number; label: string }[] = [];
    for (let i = 0; i < candles.length; i += step) {
      const d = new Date(candles[i].t);
      out.push({
        i,
        label: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }
    return out;
  }, [candles]);

  const hovered = hover != null ? candles[hover] : null;

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
      <div className="relative h-[280px] sm:h-[320px] p-2">
        {error && candles.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-destructive">
            {error}
          </div>
        ) : isLoading && candles.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full h-full"
            onMouseLeave={() => setHover(null)}
          >
            {/* Grid + Y labels */}
            {yTicks.map((v, i) => {
              const y = yFor(v);
              return (
                <g key={i}>
                  <line
                    x1={PAD_L}
                    x2={W - PAD_R}
                    y1={y}
                    y2={y}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.25}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={PAD_L - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize={10}
                    fill="hsl(var(--muted-foreground))"
                    fontFamily="ui-monospace, monospace"
                  >
                    {formatPrice(v)}
                  </text>
                </g>
              );
            })}

            {/* X labels */}
            {xTicks.map((t, i) => (
              <text
                key={i}
                x={xFor(t.i)}
                y={H - 8}
                textAnchor="middle"
                fontSize={10}
                fill="hsl(var(--muted-foreground))"
              >
                {t.label}
              </text>
            ))}

            {/* Candles */}
            {candles.map((c, i) => {
              const isUp = c.c >= c.o;
              const color = isUp ? UP : DOWN;
              const x = xFor(i);
              const yH = yFor(c.h);
              const yL = yFor(c.l);
              const yO = yFor(c.o);
              const yC = yFor(c.c);
              const top = Math.min(yO, yC);
              const bodyH = Math.max(1, Math.abs(yC - yO));
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  style={{ cursor: "crosshair" }}
                >
                  {/* Hover hit area */}
                  <rect
                    x={x - candleW / 2 - 1}
                    y={PAD_T}
                    width={candleW + 2}
                    height={innerH}
                    fill="transparent"
                  />
                  {/* Wick */}
                  <line
                    x1={x}
                    x2={x}
                    y1={yH}
                    y2={yL}
                    stroke={color}
                    strokeWidth={1}
                  />
                  {/* Body */}
                  <rect
                    x={x - candleW / 2}
                    y={top}
                    width={candleW}
                    height={bodyH}
                    fill={color}
                    opacity={0.95}
                  />
                </g>
              );
            })}

            {/* Hover crosshair */}
            {hovered && hover != null && (
              <g pointerEvents="none">
                <line
                  x1={xFor(hover)}
                  x2={xFor(hover)}
                  y1={PAD_T}
                  y2={PAD_T + innerH}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.4}
                  strokeDasharray="2 3"
                />
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={yFor(hovered.c)}
                  y2={yFor(hovered.c)}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.4}
                  strokeDasharray="2 3"
                />
              </g>
            )}
          </svg>
        )}

        {/* Hover tooltip */}
        {hovered && (
          <div className="pointer-events-none absolute top-3 left-16 rounded-md border border-border/60 bg-background/90 backdrop-blur px-2 py-1.5 text-[11px] font-mono space-y-0.5">
            <div className="text-muted-foreground">
              {new Date(hovered.t).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="flex gap-3">
              <span>O <span className="text-foreground">{formatPrice(hovered.o)}</span></span>
              <span>H <span className="text-green-400">{formatPrice(hovered.h)}</span></span>
              <span>L <span className="text-red-400">{formatPrice(hovered.l)}</span></span>
              <span>C <span className="text-foreground">{formatPrice(hovered.c)}</span></span>
            </div>
            <div className="text-muted-foreground">Vol {hovered.v.toFixed(2)}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
