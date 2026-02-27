import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import type { CryptoAsset } from '@/hooks/useMarketData';

interface PriceChartProps {
  asset: CryptoAsset;
}

export function PriceChart({ asset }: PriceChartProps) {
  if (!asset.sparkline || asset.sparkline.length === 0) {
    return (
      <Card className="glass-card p-4 text-center text-sm text-muted-foreground">
        No chart data available
      </Card>
    );
  }

  const positive = asset.priceChange7d >= 0;
  const color = positive ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)';
  const chartData = asset.sparkline.map((price, i) => ({
    time: `${Math.round((i / asset.sparkline.length) * 7)}d`,
    price,
  }));

  const minPrice = Math.min(...asset.sparkline);
  const maxPrice = Math.max(...asset.sparkline);

  const formatPrice = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    if (val >= 1) return `$${val.toFixed(2)}`;
    return `$${val.toFixed(4)}`;
  };

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img src={asset.logo} alt={asset.name} className="w-6 h-6 rounded-full" />
          <span className="font-semibold text-sm">{asset.symbol}</span>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold">
            ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {positive ? '+' : ''}{asset.priceChange7d.toFixed(2)}% 7d
          </p>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={[minPrice * 0.998, maxPrice * 1.002]} hide />
            <Tooltip
              contentStyle={{
                background: 'hsl(220, 20%, 8%)',
                border: '1px solid hsl(220, 15%, 20%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatPrice(value), 'Price']}
              labelFormatter={() => ''}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
