import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  asset_id: string;
  asset_symbol: string;
  transaction_type: string;
  amount: number;
  price_per_unit: number;
  total_value: number;
  created_at: string;
}

interface PerformanceChartProps {
  transactions: Transaction[];
  currentPrices: Map<string, number>;
}

type TimeRange = '7D' | '30D' | 'ALL';

export function PerformanceChart({ transactions, currentPrices }: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');

  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    const now = new Date();
    const cutoff = timeRange === '7D'
      ? new Date(now.getTime() - 7 * 86400000)
      : timeRange === '30D'
      ? new Date(now.getTime() - 30 * 86400000)
      : new Date(0);

    // Sort transactions by date
    const sorted = [...transactions]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Build running portfolio state over time
    const holdings: Record<string, { amount: number; avgPrice: number }> = {};
    const dataPoints: { date: string; value: number; timestamp: number }[] = [];

    sorted.forEach(tx => {
      const txDate = new Date(tx.created_at);
      
      if (!holdings[tx.asset_id]) {
        holdings[tx.asset_id] = { amount: 0, avgPrice: 0 };
      }

      if (tx.transaction_type === 'buy') {
        const h = holdings[tx.asset_id];
        const totalCost = h.amount * h.avgPrice + tx.amount * tx.price_per_unit;
        h.amount += tx.amount;
        h.avgPrice = h.amount > 0 ? totalCost / h.amount : 0;
      } else if (tx.transaction_type === 'sell') {
        holdings[tx.asset_id].amount = Math.max(0, holdings[tx.asset_id].amount - tx.amount);
      }

      // Calculate portfolio value at this point using the tx price as approximate market price
      let totalValue = 0;
      Object.entries(holdings).forEach(([assetId, h]) => {
        // Use the price from the transaction if it's the same asset, else use avg price as approximation
        const price = assetId === tx.asset_id ? tx.price_per_unit : (currentPrices.get(assetId) || h.avgPrice);
        totalValue += h.amount * price;
      });

      if (txDate >= cutoff) {
        dataPoints.push({
          date: txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(totalValue * 100) / 100,
          timestamp: txDate.getTime(),
        });
      }
    });

    // Add current value as last data point
    let currentTotal = 0;
    Object.entries(holdings).forEach(([assetId, h]) => {
      currentTotal += h.amount * (currentPrices.get(assetId) || h.avgPrice);
    });
    dataPoints.push({
      date: 'Now',
      value: Math.round(currentTotal * 100) / 100,
      timestamp: now.getTime(),
    });

    return dataPoints;
  }, [transactions, currentPrices, timeRange]);

  if (transactions.length === 0) return null;

  const startValue = chartData.length > 0 ? chartData[0].value : 0;
  const endValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const change = endValue - startValue;
  const changePct = startValue > 0 ? (change / startValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Performance</h3>
          <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{changePct.toFixed(1)}%
          </span>
        </div>
        <div className="flex gap-1">
          {(['7D', '30D', 'ALL'] as TimeRange[]).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 text-[10px] px-2 ${timeRange === range ? 'bg-primary/20 text-primary' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: 'hsl(220, 10%, 55%)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: 'hsl(220, 10%, 55%)' }}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(220, 20%, 8%)',
                border: '1px solid hsl(220, 15%, 15%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)'}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
