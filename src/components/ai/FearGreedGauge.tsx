import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
  history: { value: number; timestamp: string }[];
}

const GAUGE_COLORS = [
  { stop: 0, color: 'hsl(0, 84%, 50%)' },
  { stop: 25, color: 'hsl(30, 90%, 50%)' },
  { stop: 50, color: 'hsl(45, 90%, 50%)' },
  { stop: 75, color: 'hsl(100, 70%, 45%)' },
  { stop: 100, color: 'hsl(160, 84%, 45%)' },
];

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

function getSentimentIcon(value: number) {
  if (value <= 40) return <TrendingDown className="w-4 h-4" />;
  if (value <= 60) return <Minus className="w-4 h-4" />;
  return <TrendingUp className="w-4 h-4" />;
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
        // Fallback
        setData({ value: 50, classification: 'Neutral', timestamp: '', history: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFearGreed();
    const interval = setInterval(fetchFearGreed, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

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
  const angle = (data.value / 100) * 180 - 90; // -90 to 90 degrees
  const maxVal = Math.max(...(data.history.length > 0 ? data.history.map(h => h.value) : [50]));
  const minVal = Math.min(...(data.history.length > 0 ? data.history.map(h => h.value) : [50]));

  return (
    <Card className="glass-card p-4 overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            Market Sentiment
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: gaugeColor }} />
          </h3>
          <p className="text-[10px] text-muted-foreground">Fear & Greed Index</p>
        </div>
        <div 
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${gaugeColor}20`, color: gaugeColor }}
        >
          {getSentimentIcon(data.value)}
          {label}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative w-[100px] h-[55px] flex-shrink-0">
          <svg viewBox="0 0 120 65" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="hsl(220, 15%, 15%)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Colored arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(data.value / 100) * 157} 157`}
              style={{ filter: `drop-shadow(0 0 6px ${gaugeColor})` }}
            />
            {/* Needle */}
            <motion.line
              x1="60"
              y1="60"
              x2="60"
              y2="20"
              stroke="hsl(0, 0%, 100%)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ rotate: -90 }}
              animate={{ rotate: angle }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              style={{ transformOrigin: '60px 60px' }}
            />
            {/* Center dot */}
            <circle cx="60" cy="60" r="4" fill={gaugeColor} />
          </svg>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <motion.p 
              className="text-lg font-bold leading-none"
              style={{ color: gaugeColor }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {data.value}
            </motion.p>
          </div>
        </div>

        {/* Mini sparkline */}
        {data.history.length > 1 && (
          <div className="flex-1 h-[40px]">
            <svg viewBox={`0 0 ${data.history.length * 16} 40`} className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gaugeColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={gaugeColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={`M 0 ${40 - ((data.history[data.history.length - 1].value - minVal) / Math.max(maxVal - minVal, 1)) * 35} ${data.history
                  .slice()
                  .reverse()
                  .map((h, i) => `L ${i * 16} ${40 - ((h.value - minVal) / Math.max(maxVal - minVal, 1)) * 35}`)
                  .join(' ')} L ${(data.history.length - 1) * 16} 40 L 0 40 Z`}
                fill="url(#fgGradient)"
              />
              {/* Line */}
              <polyline
                points={data.history
                  .slice()
                  .reverse()
                  .map((h, i) => `${i * 16},${40 - ((h.value - minVal) / Math.max(maxVal - minVal, 1)) * 35}`)
                  .join(' ')}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[9px] text-muted-foreground text-right mt-0.5">7-day trend</p>
          </div>
        )}
      </div>
    </Card>
  );
}
