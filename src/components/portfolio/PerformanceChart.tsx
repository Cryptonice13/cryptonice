import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

interface PortfolioPosition {
  id: string;
  asset_id: string;
  asset_symbol: string;
  asset_name: string;
  asset_logo: string | null;
  amount: number;
  avg_buy_price: number;
  created_at: string;
  updated_at: string;
}

interface PerformanceChartProps {
  transactions: Transaction[];
  currentPrices: Map<string, number>;
  portfolio: PortfolioPosition[];
}

type TimeRange = '7D' | '30D' | 'ALL';

export function PerformanceChart({ transactions, currentPrices, portfolio }: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [selectedAsset, setSelectedAsset] = useState<string>('all');

  const assetOptions = useMemo(() => {
    return portfolio.map(p => ({
      id: p.asset_id,
      symbol: p.asset_symbol,
      name: p.asset_name,
      logo: p.asset_logo,
    }));
  }, [portfolio]);

  const { chartData, costBasis } = useMemo(() => {
    const relevantPositions = selectedAsset === 'all'
      ? portfolio
      : portfolio.filter(p => p.asset_id === selectedAsset);

    if (relevantPositions.length === 0) return { chartData: [], costBasis: 0 };

    // Cost basis = sum of (avg_buy_price * amount) for relevant positions
    const totalCostBasis = relevantPositions.reduce(
      (sum, p) => sum + p.avg_buy_price * p.amount, 0
    );

    // Current value
    const currentValue = relevantPositions.reduce(
      (sum, p) => sum + p.amount * (currentPrices.get(p.asset_id) || p.avg_buy_price), 0
    );

    const now = new Date();
    const cutoff = timeRange === '7D'
      ? new Date(now.getTime() - 7 * 86400000)
      : timeRange === '30D'
      ? new Date(now.getTime() - 30 * 86400000)
      : new Date(0);

    // Get relevant transactions in time range
    const filteredTx = (selectedAsset === 'all'
      ? transactions
      : transactions.filter(t => t.asset_id === selectedAsset))
      .filter(t => new Date(t.created_at) >= cutoff)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const dataPoints: { date: string; value: number; timestamp: number }[] = [];

    // Start point: cost basis at beginning of range
    const startLabel = timeRange === '7D' ? '7d ago' : timeRange === '30D' ? '30d ago' : 'Start';
    dataPoints.push({
      date: startLabel,
      value: Math.round(totalCostBasis * 100) / 100,
      timestamp: cutoff.getTime(),
    });

    // Add intermediate points from transactions (show portfolio value changes)
    if (filteredTx.length > 0) {
      // Build running value adjustments from transactions
      let runningValue = totalCostBasis;
      filteredTx.forEach(tx => {
        const txDate = new Date(tx.created_at);
        if (tx.transaction_type === 'buy') {
          runningValue += tx.amount * tx.price_per_unit;
        } else if (tx.transaction_type === 'sell') {
          const position = relevantPositions.find(p => p.asset_id === tx.asset_id);
          const avgPrice = position ? position.avg_buy_price : tx.price_per_unit;
          // Adjust by the P&L of the sell
          const pnl = tx.amount * (tx.price_per_unit - avgPrice);
          runningValue += pnl;
        }
        dataPoints.push({
          date: txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(runningValue * 100) / 100,
          timestamp: txDate.getTime(),
        });
      });
    }

    // End point: current value
    dataPoints.push({
      date: 'Now',
      value: Math.round(currentValue * 100) / 100,
      timestamp: now.getTime(),
    });

    return {
      chartData: dataPoints,
      costBasis: totalCostBasis,
    };
  }, [transactions, currentPrices, timeRange, selectedAsset, portfolio]);

  if (portfolio.length === 0) return null;

  const endValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const pnl = endValue - costBasis;
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  const isPositive = pnl >= 0;

  const selectedLabel = selectedAsset === 'all'
    ? 'All Assets'
    : assetOptions.find(a => a.id === selectedAsset)?.symbol?.toUpperCase() || '';

  // Y-axis domain: ±5% around the data range, never starting from 0
  const allValues = chartData.map(d => d.value);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const padding = Math.max((maxVal - minVal) * 0.1, costBasis * 0.02);
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;

  return (
    <Card className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <h3 className="text-sm font-semibold text-foreground">Performance</h3>
        </div>
        <div className="flex gap-1">
          {(['7D', '30D', 'ALL'] as TimeRange[]).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 text-[10px] px-2 ${timeRange === range ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-lg font-bold text-foreground">
          ${endValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {isPositive ? '+' : ''}{pnlPct.toFixed(1)}%
        </span>
        <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {assetOptions.length > 1 && (
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-1">
            <button
              onClick={() => setSelectedAsset('all')}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                selectedAsset === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              All Assets
            </button>
            {assetOptions.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  selectedAsset === asset.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {asset.logo && (
                  <img src={asset.logo} alt={asset.symbol} className="w-3.5 h-3.5 rounded-full" />
                )}
                {asset.symbol.toUpperCase()}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <div className="h-[180px]">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={isPositive ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
                width={48}
                domain={[yMin, yMax]}
              />
              {costBasis > 0 && (
                <ReferenceLine
                  y={costBasis}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{
                    value: 'Cost',
                    position: 'left',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 9,
                  }}
                />
              )}
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                  padding: '8px 12px',
                }}
                formatter={(value: number) => {
                  const itemPnl = value - costBasis;
                  const itemPct = costBasis > 0 ? (itemPnl / costBasis) * 100 : 0;
                  return [
                    <div key="tip" className="space-y-0.5">
                      <div className="text-foreground font-medium">${value.toLocaleString()}</div>
                      <div className="text-muted-foreground text-[10px]">Cost: ${costBasis.toLocaleString()}</div>
                      <div className={`text-[10px] font-medium ${itemPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        P&L: {itemPnl >= 0 ? '+' : ''}${itemPnl.toLocaleString()} ({itemPct.toFixed(1)}%)
                      </div>
                    </div>,
                    '',
                  ];
                }}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)'}
                strokeWidth={2}
                fill="url(#perfGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            Not enough data for {selectedLabel} in this time range
          </div>
        )}
      </div>
    </Card>
  );
}