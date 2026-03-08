import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
  history: { value: number; timestamp: string }[];
}

function getGaugeColor(value: number): string {
  if (value <= 25) return 'hsl(0, 84%, 50%)';
  if (value <= 45) return 'hsl(30, 90%, 50%)';
  if (value <= 55) return 'hsl(45, 90%, 50%)';
  if (value <= 75) return 'hsl(100, 70%, 45%)';
  return 'hsl(160, 84%, 45%)';
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
      <Card className="glass-card p-4 flex items-center justify-center h-[140px]">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </Card>
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
    <Card className="glass-card p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            Market Sentiment
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: gaugeColor }} />
          </h3>
          <p className="text-[10px] text-muted-foreground">Fear & Greed Index · Updated daily</p>
        </div>
        <div 
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${gaugeColor}20`, color: gaugeColor }}
        >
          {data.value <= 40 ? <TrendingDown className="w-3.5 h-3.5" /> : data.value <= 60 ? <Minus className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
          {label}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Gauge + Score */}
        <div className="flex flex-col items-center">
          <div className="relative w-[140px] h-[78px]">
            <svg viewBox="0 0 140 78" className="w-full h-full">
              {/* Background arc segments */}
              {[
                { start: 0, end: 0.2, color: 'hsl(0, 84%, 50%)' },
                { start: 0.2, end: 0.4, color: 'hsl(30, 90%, 50%)' },
                { start: 0.4, end: 0.6, color: 'hsl(45, 90%, 50%)' },
                { start: 0.6, end: 0.8, color: 'hsl(100, 70%, 45%)' },
                { start: 0.8, end: 1, color: 'hsl(160, 84%, 45%)' },
              ].map((seg, i) => {
                const startAngle = Math.PI + seg.start * Math.PI;
                const endAngle = Math.PI + seg.end * Math.PI;
                const x1 = 70 + 55 * Math.cos(startAngle);
                const y1 = 70 + 55 * Math.sin(startAngle);
                const x2 = 70 + 55 * Math.cos(endAngle);
                const y2 = 70 + 55 * Math.sin(endAngle);
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} A 55 55 0 0 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeLinecap="butt"
                    opacity={0.15}
                  />
                );
              })}
              {/* Active arc */}
              <path
                d={`M ${70 + 55 * Math.cos(Math.PI)} ${70 + 55 * Math.sin(Math.PI)} A 55 55 0 ${data.value > 50 ? 1 : 0} 1 ${
                  70 + 55 * Math.cos(Math.PI + (data.value / 100) * Math.PI)
                } ${70 + 55 * Math.sin(Math.PI + (data.value / 100) * Math.PI)}`}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="10"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 8px ${gaugeColor}50)` }}
              />
              {/* Needle */}
              <motion.line
                x1="70"
                y1="70"
                x2="70"
                y2="22"
                stroke="hsl(var(--foreground))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ rotate: -90 }}
                animate={{ rotate: angle }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                style={{ transformOrigin: '70px 70px' }}
              />
              <circle cx="70" cy="70" r="5" fill={gaugeColor} />
              <circle cx="70" cy="70" r="2.5" fill="hsl(var(--background))" />
              {/* Scale labels */}
              <text x="8" y="74" fontSize="8" fill="hsl(0, 84%, 50%)" fontWeight="600">0</text>
              <text x="126" y="74" fontSize="8" fill="hsl(160, 84%, 45%)" fontWeight="600">100</text>
              <text x="63" y="10" fontSize="8" fill="hsl(var(--muted-foreground))" fontWeight="500">50</text>
            </svg>
          </div>
          <motion.p
            className="text-3xl font-bold mt-1"
            style={{ color: gaugeColor }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {data.value}
          </motion.p>
          {analytics && (
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                analytics.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {analytics.dailyChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {analytics.dailyChange >= 0 ? '+' : ''}{analytics.dailyChange} 24h
              </span>
              <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                analytics.weeklyChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {analytics.weeklyChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {analytics.weeklyChange >= 0 ? '+' : ''}{analytics.weeklyChange} 7d
              </span>
            </div>
          )}
        </div>

        {/* Right: Trend chart + Stats */}
        <div className="space-y-3">
          {/* 7-day bar chart */}
          {data.history.length > 1 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-1.5">7-Day Trend</p>
              <div className="flex items-end gap-1 h-[48px]">
                {data.history.slice().reverse().map((h, i) => {
                  const barHeight = ((h.value - minVal) / range) * 40 + 8;
                  const barColor = getGaugeColor(h.value);
                  const isToday = i === data.history.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${getDayLabel(data.history.length - 1 - i)}: ${h.value}`}>
                      <motion.div
                        className="w-full rounded-sm"
                        style={{
                          backgroundColor: barColor,
                          opacity: isToday ? 1 : 0.5,
                          boxShadow: isToday ? `0 0 8px ${barColor}40` : 'none',
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: barHeight }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
                      />
                      <span className="text-[8px] text-muted-foreground leading-none">
                        {getDayLabel(data.history.length - 1 - i).slice(0, 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats grid */}
          {analytics && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Avg</p>
                <p className="text-sm font-bold" style={{ color: getGaugeColor(analytics.avg) }}>{analytics.avg}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">High</p>
                <p className="text-sm font-bold" style={{ color: getGaugeColor(analytics.high) }}>{analytics.high}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Low</p>
                <p className="text-sm font-bold" style={{ color: getGaugeColor(analytics.low) }}>{analytics.low}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      {analytics && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Analysis: </span>
            {getAnalysis(data.value, analytics.weeklyChange)}
          </p>
        </div>
      )}
    </Card>
  );
}
