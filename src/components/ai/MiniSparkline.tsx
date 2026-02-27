import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MiniSparklineProps {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
}

export function MiniSparkline({ data, positive, width = 80, height = 28 }: MiniSparklineProps) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((value, i) => ({ v: value, i }));
  const color = positive ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)';

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${positive ? 'up' : 'down'})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
