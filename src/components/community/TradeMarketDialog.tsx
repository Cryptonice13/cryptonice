import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCredits, orderSchema, SHARE_PAYOUT, type OrderInput } from '@/lib/predictionMarkets';
import { useMarketTrades, type PredictionMarket } from '@/hooks/usePredictionMarkets';
import { formatDistanceToNow } from 'date-fns';

interface TradeMarketDialogProps {
  market: PredictionMarket | null;
  open: boolean;
  submitting: boolean;
  canTrade: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaceOrder: (marketId: string, input: OrderInput) => Promise<boolean>;
}

export function TradeMarketDialog({
  market,
  open,
  submitting,
  canTrade,
  onOpenChange,
  onPlaceOrder,
}: TradeMarketDialogProps) {
  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [price, setPrice] = useState('50');
  const [quantity, setQuantity] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { trades, loading: tradesLoading } = useMarketTrades(open && market ? market.id : null);

  useEffect(() => {
    if (!market) return;
    setSide('yes');
    setPrice(String(Math.round(market.yes_price)));
    setQuantity('1');
    setErrors({});
  }, [market]);

  useEffect(() => {
    if (!market) return;
    setPrice(String(Math.round(side === 'yes' ? market.yes_price : market.no_price)));
  }, [side, market]);

  const totals = useMemo(() => {
    const p = Number(price);
    const q = Number(quantity);
    if (!Number.isFinite(p) || !Number.isFinite(q)) return { cost: 0, payout: 0, profit: 0 };
    const cost = Math.max(0, Math.round(p * q));
    const payout = Math.max(0, Math.round(q * SHARE_PAYOUT));
    return { cost, payout, profit: payout - cost };
  }, [price, quantity]);

  if (!market) return null;

  const handleSubmit = async () => {
    const parsed = orderSchema.safeParse({
      side,
      price: Number(price),
      quantity: Number(quantity),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach(issue => {
        const key = String(issue.path[0] ?? 'form');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    const ok = await onPlaceOrder(market.id, parsed.data);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">{market.question}</DialogTitle>
          <DialogDescription>
            {market.asset_symbol} · target ${Number(market.target_price).toLocaleString()} · settles{' '}
            {formatDistanceToNow(new Date(market.resolve_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('yes')}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                side === 'yes'
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-border/60 hover:bg-muted/40',
              )}
            >
              <p className="text-xs text-muted-foreground">Buy Yes</p>
              <p className="text-lg font-semibold text-emerald-400">{Math.round(market.yes_price)} cr</p>
            </button>
            <button
              type="button"
              onClick={() => setSide('no')}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                side === 'no' ? 'border-red-500/60 bg-red-500/10' : 'border-border/60 hover:bg-muted/40',
              )}
            >
              <p className="text-xs text-muted-foreground">Buy No</p>
              <p className="text-lg font-semibold text-red-400">{Math.round(market.no_price)} cr</p>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trade-price">Price per share (1-99)</Label>
              <Input
                id="trade-price"
                inputMode="numeric"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trade-quantity">Shares</Label>
              <Input
                id="trade-quantity"
                inputMode="numeric"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">You pay now</span>
              <span className="font-medium">{formatCredits(totals.cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payout if {side.toUpperCase()} wins</span>
              <span className="font-medium text-emerald-400">{formatCredits(totals.payout)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Most you can lose</span>
              <span className="font-medium text-red-400">{formatCredits(totals.cost)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2">Recent activity</p>
            {tradesLoading ? (
              <p className="text-xs text-muted-foreground">Loading activity...</p>
            ) : trades.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trades yet. You could be first.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {trades.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        t.side === 'yes'
                          ? 'text-emerald-400 border-emerald-500/30'
                          : 'text-red-400 border-red-500/30',
                      )}
                    >
                      {t.side.toUpperCase()}
                    </Badge>
                    <span className="text-muted-foreground">
                      {t.quantity} @ {t.price} cr · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!canTrade && (
            <p className="text-xs text-muted-foreground">
              You created this market, so you cannot trade in it.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !canTrade}>
            {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Buy {side.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
