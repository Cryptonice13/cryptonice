import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Strategy } from '@/hooks/useStrategyBuilder';
import { useState } from 'react';
import { format } from 'date-fns';

interface StrategyTableProps {
  strategies: Strategy[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onSelect: (strategy: Strategy) => void;
}

export default function StrategyTable({ strategies, isLoading, onDelete, onSelect }: StrategyTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const signalBadge = (signal: string) => {
    const colors: Record<string, string> = {
      BUY: 'bg-green-500/15 text-green-400 border-green-500/30',
      SELL: 'bg-red-500/15 text-red-400 border-red-500/30',
      HOLD: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    };
    return <Badge variant="outline" className={colors[signal] || ''}>{signal}</Badge>;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-primary/15 text-primary border-primary/30',
      completed: 'bg-muted text-muted-foreground',
      cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
    };
    return <Badge variant="outline" className={`text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
  };

  if (strategies.length === 0 && !isLoading) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="py-12 text-center">
          <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No strategies yet. Generate your first AI strategy above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Strategy History
          <Badge variant="secondary" className="ml-auto">{strategies.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-xs">Strategy</TableHead>
                <TableHead className="text-xs">Asset</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Signal</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Confidence</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Win Rate</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategies.map(s => (
                <TableRow
                  key={s.id}
                  className="border-border/30 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onSelect(s)}
                >
                  <TableCell className="font-medium text-sm max-w-[160px] truncate">{s.strategy_name}</TableCell>
                  <TableCell className="text-sm font-mono">{s.asset_symbol}</TableCell>
                  <TableCell className="text-xs capitalize">{s.strategy_type.replace('_', ' ')}</TableCell>
                  <TableCell>{signalBadge(s.signal)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{s.confidence ?? '-'}%</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{s.win_rate ?? '-'}%</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {format(new Date(s.created_at), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
