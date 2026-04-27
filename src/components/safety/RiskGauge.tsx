import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskGaugeProps {
  score: number;
  level: string;
  recommendation: string;
}

const LEVEL_META: Record<string, { color: string; ring: string; bg: string; Icon: typeof Shield; label: string }> = {
  safe: { color: 'text-emerald-500', ring: 'stroke-emerald-500', bg: 'bg-emerald-500/10', Icon: ShieldCheck, label: 'Safe' },
  low: { color: 'text-lime-500', ring: 'stroke-lime-500', bg: 'bg-lime-500/10', Icon: ShieldCheck, label: 'Low Risk' },
  medium: { color: 'text-amber-500', ring: 'stroke-amber-500', bg: 'bg-amber-500/10', Icon: Shield, label: 'Medium Risk' },
  high: { color: 'text-orange-500', ring: 'stroke-orange-500', bg: 'bg-orange-500/10', Icon: ShieldAlert, label: 'High Risk' },
  critical: { color: 'text-red-500', ring: 'stroke-red-500', bg: 'bg-red-500/10', Icon: ShieldX, label: 'Critical Risk' },
};

const REC_META: Record<string, { color: string; label: string }> = {
  BUY_OK: { color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30', label: 'Reasonable to trade' },
  CAUTION: { color: 'bg-amber-500/15 text-amber-500 border-amber-500/30', label: 'Trade with caution' },
  AVOID: { color: 'bg-red-500/15 text-red-500 border-red-500/30', label: 'AVOID' },
};

export default function RiskGauge({ score, level, recommendation }: RiskGaugeProps) {
  const meta = LEVEL_META[level] || LEVEL_META.medium;
  const rec = REC_META[recommendation] || REC_META.CAUTION;
  const Icon = meta.Icon;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} className="fill-none stroke-muted" strokeWidth="10" />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            className={cn('fill-none transition-all', meta.ring)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={cn('w-7 h-7 mb-1', meta.color)} />
          <div className={cn('text-4xl font-bold tabular-nums', meta.color)}>{score}</div>
          <div className="text-xs text-muted-foreground">/ 100 risk</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className={cn('px-3 py-1 rounded-full text-sm font-semibold', meta.bg, meta.color)}>{meta.label}</div>
        <div className={cn('px-4 py-1.5 rounded-md text-sm font-bold border', rec.color)}>{rec.label}</div>
      </div>
    </div>
  );
}
