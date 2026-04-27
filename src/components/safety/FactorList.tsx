import { CheckCircle2, AlertTriangle, AlertCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { SafetyFactor } from '@/hooks/useSafetyScan';

const SEVERITY_META = {
  good:     { Icon: CheckCircle2,  color: 'text-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
  info:     { Icon: Info,          color: 'text-sky-500',     border: 'border-sky-500/30',     bg: 'bg-sky-500/5' },
  warning:  { Icon: AlertTriangle, color: 'text-amber-500',   border: 'border-amber-500/30',   bg: 'bg-amber-500/5' },
  danger:   { Icon: AlertCircle,   color: 'text-orange-500',  border: 'border-orange-500/30',  bg: 'bg-orange-500/5' },
  critical: { Icon: XCircle,       color: 'text-red-500',     border: 'border-red-500/30',     bg: 'bg-red-500/5' },
};

const SEVERITY_ORDER = { critical: 0, danger: 1, warning: 2, info: 3, good: 4 };

export default function FactorList({ factors }: { factors: SafetyFactor[] }) {
  if (!factors || factors.length === 0) {
    return <p className="text-sm text-muted-foreground">No factors analyzed.</p>;
  }
  const sorted = [...factors].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
  );
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {sorted.map((f, i) => {
        const meta = SEVERITY_META[f.severity] || SEVERITY_META.info;
        const Icon = meta.Icon;
        return (
          <Card key={`${f.key}-${i}`} className={cn('p-3 border', meta.border, meta.bg)}>
            <div className="flex items-start gap-2.5">
              <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', meta.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-semibold truncate">{f.label}</span>
                  <span className={cn('text-xs font-bold tabular-nums flex-shrink-0', meta.color)}>{f.value}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
