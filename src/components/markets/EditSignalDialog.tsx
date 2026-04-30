import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSignalMarketplace, type PublishedSignal } from '@/hooks/useSignalMarketplace';

interface Props {
  signal: PublishedSignal | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}

export function EditSignalDialog({ signal: sig, open, onOpenChange, onSaved }: Props) {
  const { updateSignal } = useSignalMarketplace();
  const [submitting, setSubmitting] = useState(false);
  const [signal, setSignal] = useState<'BUY' | 'SELL' | 'HOLD'>(sig?.signal || 'BUY');
  const [entry, setEntry] = useState(sig?.entry_price?.toString() || '');
  const [sl, setSl] = useState(sig?.stop_loss?.toString() || '');
  const [tp1, setTp1] = useState(sig?.take_profits?.[0]?.toString() || '');
  const [tp2, setTp2] = useState(sig?.take_profits?.[1]?.toString() || '');
  const [tp3, setTp3] = useState(sig?.take_profits?.[2]?.toString() || '');
  const [timeframe, setTimeframe] = useState(sig?.timeframe || '1W');
  const [reasoning, setReasoning] = useState(sig?.reasoning || '');

  useEffect(() => {
    if (!sig) return;
    setSignal(sig.signal);
    setEntry(sig.entry_price?.toString() || '');
    setSl(sig.stop_loss?.toString() || '');
    setTp1(sig.take_profits?.[0]?.toString() || '');
    setTp2(sig.take_profits?.[1]?.toString() || '');
    setTp3(sig.take_profits?.[2]?.toString() || '');
    setTimeframe(sig.timeframe || '1W');
    setReasoning(sig.reasoning || '');
  }, [sig?.id]);

  const valid = entry && sl && tp1 && reasoning.trim().length >= 20;

  const handleSubmit = async () => {
    if (!sig || !valid) return;
    setSubmitting(true);
    try {
      const tps = [tp1, tp2, tp3].filter(Boolean).map(Number);
      const ok = await updateSignal(sig.id, {
        signal,
        entry_price: Number(entry),
        stop_loss: Number(sl),
        take_profits: tps,
        timeframe,
        reasoning: reasoning.trim(),
      });
      if (ok) {
        onOpenChange(false);
        onSaved?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!sig) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Edit {sig.asset_symbol} Signal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Signal</Label>
              <Select value={signal} onValueChange={(v: any) => setSignal(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL</SelectItem>
                  <SelectItem value="HOLD">HOLD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1H">1 Hour</SelectItem>
                  <SelectItem value="4H">4 Hours</SelectItem>
                  <SelectItem value="1D">1 Day</SelectItem>
                  <SelectItem value="3D">3 Days</SelectItem>
                  <SelectItem value="1W">1 Week</SelectItem>
                  <SelectItem value="2W">2 Weeks</SelectItem>
                  <SelectItem value="1M">1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Entry Price ($)</Label>
            <Input type="number" value={entry} onChange={e => setEntry(e.target.value)} className="h-9 font-mono" />
          </div>
          <div>
            <Label className="text-xs text-red-400">Stop Loss ($)</Label>
            <Input type="number" value={sl} onChange={e => setSl(e.target.value)} className="h-9 font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-green-400">Take Profits ($)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="TP1*" value={tp1} onChange={e => setTp1(e.target.value)} className="h-9 font-mono text-xs" />
              <Input type="number" placeholder="TP2" value={tp2} onChange={e => setTp2(e.target.value)} className="h-9 font-mono text-xs" />
              <Input type="number" placeholder="TP3" value={tp3} onChange={e => setTp3(e.target.value)} className="h-9 font-mono text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Reasoning</Label>
            <Textarea value={reasoning} onChange={e => setReasoning(e.target.value)} rows={4} className="text-xs" />
            <p className="text-[10px] text-muted-foreground mt-1">{reasoning.length}/500 chars</p>
          </div>
          <Button onClick={handleSubmit} disabled={!valid || submitting} className="w-full button-gradient">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
