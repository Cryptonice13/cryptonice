import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, CheckCircle, Loader2, Tag, Zap, ShieldCheck } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: { key: string; name: string; price: number; credits: number } | null;
  onComplete: (planKey: string, couponCode?: string) => Promise<boolean>;
}

export function PaymentDialog({ open, onOpenChange, plan, onComplete }: PaymentDialogProps) {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [couponCode, setCouponCode] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  if (!plan) return null;

  const isCouponValid = couponCode.trim().toUpperCase() === 'CRYPTOAI';
  const isFree = isCouponValid;
  const finalPrice = isFree ? 0 : plan.price;
  const bonusCredits = isCouponValid ? Math.floor(plan.credits * 1.2) : plan.credits;

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const canSubmit = isFree || (cardNumber.replace(/\s/g, '').length >= 13 && expiry.length >= 4 && cvv.length >= 3 && cardName.trim().length > 0);

  const handleSubmit = async () => {
    setStep('processing');
    // Simulate payment processing
    await new Promise(r => setTimeout(r, isFree ? 800 : 2000));
    const success = await onComplete(plan.key, isCouponValid ? couponCode : undefined);
    if (success) {
      setStep('success');
    } else {
      setStep('details');
    }
  };

  const handleClose = () => {
    setStep('details');
    setCouponCode('');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'success' ? (
              <><CheckCircle className="w-5 h-5 text-green-400" /> Payment Successful</>
            ) : (
              <><CreditCard className="w-5 h-5 text-primary" /> Purchase Credits</>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'success' ? 'Your credits have been added!' : `${plan.name} Plan`}
          </DialogDescription>
        </DialogHeader>

        {step === 'success' ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bonusCredits} credits</p>
              <p className="text-sm text-muted-foreground">added to your account</p>
            </div>
            {isCouponValid && (
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                100% off coupon applied!
              </Badge>
            )}
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : step === 'processing' ? (
          <div className="text-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Processing payment...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="p-3 rounded-lg bg-secondary/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{plan.name} Plan</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" />{plan.credits} credits</span>
              </div>
              {isCouponValid && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Coupon bonus</span>
                  <span>+{bonusCredits - plan.credits} credits</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{isFree ? <Badge className="bg-green-500/10 text-green-400 border-green-500/20">FREE</Badge> : `$${finalPrice}`}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Tag className="w-3 h-3" /> Coupon Code</Label>
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="bg-secondary/50"
              />
              {isCouponValid && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> CryptoAI coupon applied — 100% off!
                </p>
              )}
            </div>

            {/* Card Details - only if not free */}
            {!isFree && (
              <div className="space-y-3">
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs">Cardholder Name</Label>
                  <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="John Doe" className="bg-secondary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Card Number</Label>
                  <Input
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    className="bg-secondary/50 font-mono"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expiry</Label>
                    <Input
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="bg-secondary/50 font-mono"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CVV</Label>
                    <Input
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      className="bg-secondary/50 font-mono"
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full gap-2">
              <ShieldCheck className="w-4 h-4" />
              {isFree ? 'Claim Free Credits' : `Pay $${finalPrice}`}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure payment · SSL encrypted
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
