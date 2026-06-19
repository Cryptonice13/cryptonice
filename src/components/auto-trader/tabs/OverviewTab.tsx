import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Cpu, ShieldCheck, Sparkles, LineChart } from 'lucide-react';
import { useStrategies } from '@/hooks/useStrategies';

export default function OverviewTab() {
  const { strategies } = useStrategies();
  const active = strategies.filter(s => s.status === 'active').length;
  const aiCount = strategies.filter(s => s.source === 'ai').length;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Autonomous Trader</h3>
          <Badge variant="outline" className="ml-auto text-[10px]">Paper mode</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Generate strategies with AI, backtest them on real market data, and (in upcoming phases) run them
          in paper mode with automated risk and portfolio rebalancing.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Sparkles className="w-4 h-4 text-primary" />} label="Strategies" value={String(strategies.length)} />
        <Stat icon={<Activity className="w-4 h-4 text-emerald-500" />} label="Active" value={String(active)} />
        <Stat icon={<Sparkles className="w-4 h-4 text-purple-400" />} label="AI-generated" value={String(aiCount)} />
        <Stat icon={<ShieldCheck className="w-4 h-4 text-amber-500" />} label="Live trading" value="Disabled" />
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Get started</h4>
        </div>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
          <li>Open <strong>Strategies</strong> and describe a trading idea in plain English.</li>
          <li>Switch to <strong>Backtest</strong>, pick an asset and timeframe, and review the metrics.</li>
          <li>Activate the strategy; the paper-trading engine (coming next) will run it on live prices.</li>
        </ol>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">{icon}{label}</div>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </Card>
  );
}
