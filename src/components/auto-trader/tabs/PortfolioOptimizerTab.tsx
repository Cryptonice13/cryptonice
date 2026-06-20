import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart as PieIcon, Sparkles, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePortfolioOptimizer } from '@/hooks/usePortfolioOptimizer';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export default function PortfolioOptimizerTab() {
  const { target, loading, error, optimize } = usePortfolioOptimizer();
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [horizon, setHorizon] = useState<'short' | 'medium' | 'long'>('medium');

  const data = useMemo(() =>
    (target?.weights || []).map((w, i) => ({ name: w.symbol, value: Number(w.weight), color: COLORS[i % COLORS.length] })),
    [target]
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Portfolio Optimizer</h3>
          <Badge variant="outline" className="ml-auto text-[10px]">5 credits</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Risk</label>
            <Select value={risk} onValueChange={(v: any) => setRisk(v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Horizon</label>
            <Select value={horizon} onValueChange={(v: any) => setHorizon(v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button size="sm" className="w-full" onClick={() => optimize(risk, horizon)} disabled={loading}>
          <Sparkles className="w-3.5 h-3.5 mr-1" />{loading ? 'Optimizing...' : 'Optimize with AI'}
        </Button>
        {error && (
          <div className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{error}
          </div>
        )}
      </Card>

      {target && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Target Allocation</h4>
            <span className="text-[10px] text-muted-foreground">
              {new Date(target.generated_at).toLocaleString()}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} ${value}%`}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {target.rationale && (
            <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">{target.rationale}</p>
          )}
        </Card>
      )}
    </div>
  );
}
