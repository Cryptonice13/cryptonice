import { useState } from 'react';
import { ChevronRight, Check, X, Loader2, Wrench } from 'lucide-react';
import { AgentToolCard, type ToolCall } from './AgentToolCard';
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

function StepRow({ step, index }: { step: AgentStep; index: number }) {
  const [open, setOpen] = useState(false);
  const isRunning = step.status === 'running';
  const isError = step.status === 'error';

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
        <Wrench className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-medium truncate flex-1">{prettyName(step.name)}</span>
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
              {!isRunning && step.result !== undefined && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Result</div>
                  <AgentToolCard call={{ name: step.name, args: step.args, result: step.result } as ToolCall} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AgentStepTimeline({ steps, statusLabel }: { steps: AgentStep[]; statusLabel?: string | null }) {
  if (!steps.length && !statusLabel) return null;
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => <StepRow key={s.id} step={s} index={i} />)}
      {statusLabel && (
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{statusLabel}</span>
        </div>
      )}
    </div>
  );
}
