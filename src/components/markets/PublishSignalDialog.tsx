import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSignalMarketplace } from '@/hooks/useSignalMarketplace';

interface Props {
  asset: { id: string; symbol: string; name: string; logo: string };
  prefill?: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    entry: number;
    stopLoss: number;
    takeProfits: number[];
    reasoning: string;
    timeframe?: string;
  };
  trigger?: React.ReactNode;
}

export function PublishSignalDialog({ asset, prefill, trigger }: Props) {
  const { publishSignal } = useSignalMarketplace();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signal, setSignal] = useState<'BUY' | 'SELL' | 'HOLD'>(prefill?.signal || 'BUY');
  const [entry, setEntry] = useState(prefill?.entry?.toString() || '');
  const [sl, setSl] = useState(prefill?.stopLoss?.toString() || '');
  const [tp1, setTp1] = useState(prefill?.takeProfits?.[0]?.toString() || '');
  const [tp2, setTp2] = useState(prefill?.takeProfits?.[1]?.toString() || '');
  const [tp3, setTp3] = useState(prefill?.takeProfits?.[2]?.toString() || '');
  const [timeframe, setTimeframe] = useState(prefill?.timeframe || '1W');
  const [reasoning, setReasoning] = useState(prefill?.reasoning || '');

  const reset = () => {
    setSignal(prefill?.signal || 'BUY');
    setEntry(prefill?.entry?.toString() || '');
    setSl(prefill?.stopLoss?.toString() || '');
    setTp1(prefill?.takeProfits?.[0]?.toString() || '');
    setTp2(prefill?.takeProfits?.[1]?.toString() || '');
    setTp3(prefill?.takeProfits?.[2]?.toString() || '');
    setReasoning(prefill?.reasoning || '');
  };

  const valid = entry && sl && tp1 && reasoning.trim().length >= 20;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      const tps = [tp1, tp2, tp3].filter(Boolean).map(Number);
      const result = await publishSignal({
        asset_id: asset.id,
        asset_symbol: asset.symbol,
        asset_name: asset.name,
        asset_logo: asset.logo,
        signal,
        entry_price: Number(entry),
        stop_loss: Number(sl),
        take_profits: tps,
        timeframe,
        reasoning: reasoning.trim(),
      });
      if (result) {
        setOpen(false);
        reset();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5">
            <Send className="w-3 h-3" /> Publish to Marketplace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <img src={asset.logo} className="w-5 h-5 rounded-full" alt="" />
            Publish {asset.symbol} Signal
            <Badge variant="outline" className="text-[10px] h-5 ml-auto">2 credits</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-2.5">
            <p className="text-[11px] text-yellow-200/90 leading-snug">
              ⚡ Once published, this signal is locked and tracked against live prices. Wins/losses become part of your verified track record.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Signal</Label>
              <Select value={signal} onValueChange={(v: any) => setSignal(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY (long)</SelectItem>
                  <SelectItem value="SELL">SELL (short)</SelectItem>
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
            <Label className="text-xs">Reasoning <span className="text-muted-foreground">(min 20 chars)</span></Label>
            <Textarea
              value={reasoning}
              onChange={e => setReasoning(e.target.value)}
              placeholder="Explain why this trade — technicals, catalysts, risk factors..."
              rows={4}
              className="text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{reasoning.length}/500 chars</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!valid || submitting}
            className="w-full button-gradient"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Publish Signal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
