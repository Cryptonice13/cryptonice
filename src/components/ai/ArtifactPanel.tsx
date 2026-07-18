import { Wrench, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TOOL_META, renderResult, type ToolCall } from './AgentToolCard';

interface ArtifactPanelProps {
  artifact: { call: ToolCall; index?: number } | null;
  onClose: () => void;
}

export function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!artifact) return null;
  const { call, index } = artifact;
  const meta = TOOL_META[call.name] || { label: call.name, icon: Wrench, cost: 0 };
  const Icon = meta.icon;
  const symbol = call.args?.symbol ? String(call.args.symbol).toUpperCase() : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(call.result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <Sheet open={!!artifact} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col gap-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {typeof index === 'number' && (
                  <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
                )}
                <h3 className="font-semibold text-sm truncate">{meta.label}</h3>
                {symbol && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{symbol}</Badge>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">{call.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={copy} className="h-8 gap-1.5 text-[11px]" title="Copy JSON">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              {renderResult(call.name, call.result)}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
