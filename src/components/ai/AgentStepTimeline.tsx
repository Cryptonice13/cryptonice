import { useState } from 'react';
import { ChevronRight, Check, X, Loader2, Wrench, ArrowUpRight } from 'lucide-react';
import { TOOL_META, type ToolCall } from './AgentToolCard';
import { motion, AnimatePresence } from 'framer-motion';

export interface AgentStep {
  id: string;
  name: string;
  args: any;
  result?: any;
  status: 'running' | 'done' | 'error';
  ms?: number;
}

const prettyName = (n: string) =>
  n.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function StepRow({
  step,
  index,
  onOpenArtifact,
}: {
  step: AgentStep;
  index: number;
  onOpenArtifact?: (call: ToolCall, index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const isRunning = step.status === 'running';
  const isError = step.status === 'error';
  const meta = TOOL_META[step.name];
  const Icon = meta?.icon || Wrench;
  const hasArtifact = !isRunning && step.result !== undefined && !step.result?.error;

  return (
    <div className="border border-border/40 rounded-lg bg-background/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : isError ? (
            <X className="w-3.5 h-3.5 text-destructive" />
          ) : (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">#{index + 1}</span>
        <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-medium truncate flex-1">{meta?.label || prettyName(step.name)}</span>
        {typeof step.ms === 'number' && !isRunning && (
          <span className="text-[10px] text-muted-foreground font-mono">{(step.ms / 1000).toFixed(1)}s</span>
        )}
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-2 border-t border-border/40">
              {step.args && Object.keys(step.args).length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Input</div>
                  <pre className="text-[10px] bg-muted/30 rounded p-1.5 overflow-x-auto">
                    {JSON.stringify(step.args, null, 2)}
                  </pre>
                </div>
              )}
              {hasArtifact && onOpenArtifact && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenArtifact(
                      { name: step.name, args: step.args, result: step.result } as ToolCall,
                      index,
                    )
                  }
                  className="group w-full flex items-center justify-between gap-2 rounded-md border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 hover:border-primary/40 px-2.5 py-2 transition-all"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-medium">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    Open artifact
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </button>
              )}
              {!isRunning && step.result?.error && (
                <div className="text-[11px] text-destructive bg-destructive/10 rounded p-2">
                  {String(step.result.error)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AgentStepTimeline({
  steps,
  statusLabel,
  onOpenArtifact,
}: {
  steps: AgentStep[];
  statusLabel?: string | null;
  onOpenArtifact?: (call: ToolCall, index: number) => void;
}) {
  if (!steps.length && !statusLabel) return null;
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => (
        <StepRow key={s.id} step={s} index={i} onOpenArtifact={onOpenArtifact} />
      ))}
      {statusLabel && (
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{statusLabel}</span>
        </div>
      )}
    </div>
  );
}
