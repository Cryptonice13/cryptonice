import { useState, useEffect, useMemo } from 'react';
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
  history: { value: number; timestamp: string }[];
}

function getGaugeColor(value: number): string {
  if (value <= 25) return 'hsl(var(--sentiment-fear))';
  if (value <= 55) return 'hsl(var(--sentiment-caution))';
  if (value <= 75) return 'hsl(var(--sentiment-greed))';
  return 'hsl(var(--sentiment-extreme))';
}

function getChangeClass(value: number): string {
  return value >= 0 ? 'text-sentiment-extreme' : 'text-sentiment-fear';
}

function getLabel(value: number): string {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
}

function getAnalysis(value: number, change: number): string {
  if (value <= 20) return 'Markets are in panic. Historically, extreme fear can signal buying opportunities as assets become oversold.';
  if (value <= 40) return change < -5 
    ? 'Sentiment is declining rapidly. Investors are cautious — watch for potential capitulation or reversal signals.'
    : 'Moderate fear in the market. Smart money often accumulates during fearful periods.';
  if (value <= 60) return 'Market sentiment is balanced. Neither fear nor greed dominates — consolidation phase likely.';
  if (value <= 80) return change > 5
    ? 'Greed is accelerating. Consider taking partial profits as overextended rallies often face corrections.'
    : 'Bullish sentiment prevails. Markets are optimistic but not yet euphoric.';
  return 'Extreme greed signals potential market top. Exercise caution — euphoria often precedes sharp corrections.';
}

function getDayLabel(daysAgo: number): string {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en', { weekday: 'short' });
}

export function FearGreedGauge() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFearGreed = async () => {
      try {
        const response = await fetch('https://api.alternative.me/fng/?limit=8&format=json');
        if (!response.ok) throw new Error('API error');
        const json = await response.json();
        const entries = json.data || [];
        
        setData({
          value: parseInt(entries[0]?.value || '50'),
          classification: entries[0]?.value_classification || 'Neutral',
          timestamp: entries[0]?.timestamp || '',
          history: entries.map((e: any) => ({
            value: parseInt(e.value),
            timestamp: e.timestamp,
          })),
        });
      } catch (err) {
        console.error('Fear & Greed fetch failed:', err);
        setData({ value: 50, classification: 'Neutral', timestamp: '', history: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFearGreed();
    const interval = setInterval(fetchFearGreed, 300000);
    return () => clearInterval(interval);
  }, []);

  const analytics = useMemo(() => {
    if (!data || data.history.length < 2) return null;
    const current = data.value;
    const yesterday = data.history[1]?.value ?? current;
    const weekAgo = data.history[data.history.length - 1]?.value ?? current;
    const dailyChange = current - yesterday;
    const weeklyChange = current - weekAgo;
    const avg = Math.round(data.history.reduce((sum, h) => sum + h.value, 0) / data.history.length);
    const high = Math.max(...data.history.map(h => h.value));
    const low = Math.min(...data.history.map(h => h.value));
    return { dailyChange, weeklyChange, avg, high, low };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-[260px] items-center justify-center" aria-label="Loading market sentiment">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const gaugeColor = getGaugeColor(data.value);
  const label = getLabel(data.value);
  const angle = (data.value / 100) * 180 - 90;
  const maxVal = Math.max(...(data.history.length > 0 ? data.history.map(h => h.value) : [50]));
  const minVal = Math.min(...(data.history.length > 0 ? data.history.map(h => h.value) : [50]));
  const range = Math.max(maxVal - minVal, 1);

  return (
    <div className="overflow-hidden p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
            <Activity className="h-3 w-3 text-primary" /> Live market mood
          </p>
          <h3 className="text-base font-semibold">
            Fear &amp; Greed Index
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Updated daily from broad crypto-market signals</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold" style={{ color: gaugeColor }}>
          {data.value <= 40 ? <TrendingDown className="h-3.5 w-3.5" /> : data.value <= 60 ? <Minus className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
          {label}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(150px,0.8fr)_minmax(190px,1.2fr)]">
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/20 px-3 py-4">
          <div className="relative h-[92px] w-[168px]">
            <svg viewBox="0 0 168 92" className="h-full w-full" aria-label={`Market sentiment score ${data.value} out of 100`} role="img">
              {[
                { start: 0, end: 0.2, color: 'hsl(var(--sentiment-fear))' },
                { start: 0.2, end: 0.4, color: 'hsl(var(--sentiment-caution))' },
                { start: 0.4, end: 0.6, color: 'hsl(var(--sentiment-caution))' },
                { start: 0.6, end: 0.8, color: 'hsl(var(--sentiment-greed))' },
                { start: 0.8, end: 1, color: 'hsl(var(--sentiment-extreme))' },
              ].map((seg, i) => {
                const startAngle = Math.PI + seg.start * Math.PI;
                const endAngle = Math.PI + seg.end * Math.PI;
                const x1 = 84 + 67 * Math.cos(startAngle);
                const y1 = 82 + 67 * Math.sin(startAngle);
                const x2 = 84 + 67 * Math.cos(endAngle);
                const y2 = 82 + 67 * Math.sin(endAngle);
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} A 67 67 0 0 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="11"
                    strokeLinecap="butt"
                    opacity={0.22}
                  />
                );
              })}
              <path
                d={`M ${84 + 67 * Math.cos(Math.PI)} ${82 + 67 * Math.sin(Math.PI)} A 67 67 0 ${data.value > 50 ? 1 : 0} 1 ${
                  84 + 67 * Math.cos(Math.PI + (data.value / 100) * Math.PI)
                } ${82 + 67 * Math.sin(Math.PI + (data.value / 100) * Math.PI)}`}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="11"
                strokeLinecap="round"
              />
              <motion.line
                x1="84"
                y1="82"
                x2="84"
                y2="28"
                stroke="hsl(var(--foreground))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ rotate: -90 }}
                animate={{ rotate: angle }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                style={{ transformOrigin: '84px 82px' }}
              />
              <circle cx="84" cy="82" r="5" fill={gaugeColor} />
              <circle cx="84" cy="82" r="2.5" fill="hsl(var(--background))" />
              <text x="8" y="89" fontSize="8" fill="hsl(var(--sentiment-fear))" fontWeight="600">0</text>
              <text x="147" y="89" fontSize="8" fill="hsl(var(--sentiment-extreme))" fontWeight="600">100</text>
            </svg>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <motion.p className="text-4xl font-bold" style={{ color: gaugeColor }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>{data.value}</motion.p>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          {analytics && (
            <div className="mt-2 flex items-center gap-3">
              <span className={`flex items-center gap-0.5 text-[11px] font-medium ${getChangeClass(analytics.dailyChange)}`}>
                {analytics.dailyChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {analytics.dailyChange >= 0 ? '+' : ''}{analytics.dailyChange} 24h
              </span>
              <span className={`flex items-center gap-0.5 text-[11px] font-medium ${getChangeClass(analytics.weeklyChange)}`}>
                {analytics.weeklyChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {analytics.weeklyChange >= 0 ? '+' : ''}{analytics.weeklyChange} 7d
              </span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5">
          {data.history.length > 1 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium">7-day momentum</p>
                <span className="text-[10px] text-muted-foreground">Oldest → Today</span>
              </div>
              <div className="flex h-[72px] items-end gap-1.5">
                {data.history.slice().reverse().map((h, i) => {
                  const barHeight = ((h.value - minVal) / range) * 48 + 16;
                  const barColor = getGaugeColor(h.value);
                  const isToday = i === data.history.length - 1;
                  return (
                    <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${getDayLabel(data.history.length - 1 - i)}: ${h.value}`}>
                      <motion.div
                        className="w-full rounded-sm"
                        style={{ backgroundColor: barColor, opacity: isToday ? 1 : 0.48 }}
                        initial={{ height: 0 }}
                        animate={{ height: barHeight }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
                      />
                      <span className="text-[9px] leading-none text-muted-foreground">
                        {getDayLabel(data.history.length - 1 - i).slice(0, 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analytics && (
            <div className="mt-3 grid grid-cols-3 divide-x divide-border/60 border-t border-border/60 pt-3">
              {[['Average', analytics.avg], ['High', analytics.high], ['Low', analytics.low]].map(([name, value]) => (
                <div className="text-center" key={name}>
                  <p className="text-[9px] uppercase text-muted-foreground">{name}</p>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: getGaugeColor(Number(value)) }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {analytics && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase text-primary">Market read</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {getAnalysis(data.value, analytics.weeklyChange)}
          </p>
        </div>
      )}
    </div>
  );
}
