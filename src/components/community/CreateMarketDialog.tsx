import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { PREDICTION_ASSETS, createMarketSchema, type CreateMarketInput } from '@/lib/predictionMarkets';

interface CreateMarketDialogProps {
  submitting: boolean;
  onCreate: (input: CreateMarketInput) => Promise<boolean>;
}

function defaultLocalDateTime(hoursAhead: number): string {
  const d = new Date(Date.now() + hoursAhead * 3600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateMarketDialog({ submitting, onCreate }: CreateMarketDialogProps) {
  const [open, setOpen] = useState(false);
  const [assetSymbol, setAssetSymbol] = useState('BTC');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [closeAt, setCloseAt] = useState(defaultLocalDateTime(24));
  const [resolveAt, setResolveAt] = useState(defaultLocalDateTime(25));
  const [question, setQuestion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const suggestedQuestion = useMemo(() => {
    if (!targetPrice) return '';
    const price = Number(targetPrice);
    if (!Number.isFinite(price) || price <= 0) return '';
    return `Will ${assetSymbol} be ${direction} $${price.toLocaleString()} at settlement?`;
  }, [assetSymbol, direction, targetPrice]);

  const reset = () => {
    setAssetSymbol('BTC');
    setDirection('above');
    setTargetPrice('');
    setCloseAt(defaultLocalDateTime(24));
    setResolveAt(defaultLocalDateTime(25));
    setQuestion('');
    setErrors({});
  };

  const handleSubmit = async () => {
    const candidate = {
      question: (question || suggestedQuestion).trim(),
      assetSymbol,
      targetPrice: Number(targetPrice),
      direction,
      closeAt: new Date(closeAt).toISOString(),
      resolveAt: new Date(resolveAt).toISOString(),
    };

    const parsed = createMarketSchema.safeParse(candidate);
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
    const ok = await onCreate(parsed.data);
    if (ok) {
      reset();
      setOpen(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" />
        New market
      </Button>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a prediction market</DialogTitle>
          <DialogDescription>
            Ask a yes-or-no question about a crypto price. Everyone trades with credits, and the result is settled
            automatically from the market price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="market-asset">Asset</Label>
              <Select value={assetSymbol} onValueChange={setAssetSymbol}>
                <SelectTrigger id="market-asset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {PREDICTION_ASSETS.map(asset => (
                    <SelectItem key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} · {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="market-direction">Outcome is Yes when price is</Label>
              <Select value={direction} onValueChange={v => setDirection(v as 'above' | 'below')}>
                <SelectTrigger id="market-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above target</SelectItem>
                  <SelectItem value="below">Below target</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="market-target">Target price (USD)</Label>
            <Input
              id="market-target"
              inputMode="decimal"
              placeholder="e.g. 100000"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
            />
            {errors.targetPrice && <p className="text-xs text-destructive">{errors.targetPrice}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="market-close">Trading closes</Label>
              <Input
                id="market-close"
                type="datetime-local"
                value={closeAt}
                onChange={e => setCloseAt(e.target.value)}
              />
              {errors.closeAt && <p className="text-xs text-destructive">{errors.closeAt}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="market-resolve">Settles at</Label>
              <Input
                id="market-resolve"
                type="datetime-local"
                value={resolveAt}
                onChange={e => setResolveAt(e.target.value)}
              />
              {errors.resolveAt && <p className="text-xs text-destructive">{errors.resolveAt}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="market-question">Question</Label>
            <Input
              id="market-question"
              placeholder={suggestedQuestion || 'Will BTC be above $100,000 at settlement?'}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={240}
            />
            {suggestedQuestion && !question && (
              <p className="text-xs text-muted-foreground">Leave blank to use: {suggestedQuestion}</p>
            )}
            {errors.question && <p className="text-xs text-destructive">{errors.question}</p>}
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
            <p className="text-xs font-medium">How it settles</p>
            <p className="text-xs text-muted-foreground">
              At the settlement time the price of {assetSymbol} is checked. Yes wins if it is {direction} your target.
              Each winning share pays 100 credits. You cannot trade in your own market.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Publish market
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
