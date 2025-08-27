import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTokenBySymbol } from '@/config/tokens';
import { useLendingPool } from '@/hooks/useLendingPool';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency } from '@/lib/format';

interface RepayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenSymbol: string;
  borrowedAmount?: string;
}

export const RepayModal = ({ open, onOpenChange, tokenSymbol, borrowedAmount = '0' }: RepayModalProps) => {
  const [amount, setAmount] = useState('');
  const { repay, isTransactionPending } = useLendingPool();
  const { isConnected, balance } = useWallet();
  
  const token = getTokenBySymbol(tokenSymbol);
  
  if (!token) return null;

  const handleRepay = async () => {
    if (!amount || !isConnected) return;
    
    try {
      await repay(token.address, amount);
      setAmount('');
      onOpenChange(false);
    } catch (error) {
      console.error('Repay failed:', error);
    }
  };

  const handleMaxClick = () => {
    const maxRepayable = Math.min(
      parseFloat(balance?.formatted || '0'),
      parseFloat(borrowedAmount)
    );
    setAmount(maxRepayable.toString());
  };

  const estimatedValue = amount ? parseFloat(amount) * 2000 : 0; // Mock price

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img 
              src={token.logo} 
              alt={token.name}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            Repay {token.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                onClick={handleMaxClick}
              >
                MAX
              </Button>
            </div>
            {amount && (
              <p className="text-sm text-muted-foreground">
                ≈ {formatCurrency(estimatedValue)}
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Borrowed Amount</span>
              <span>{borrowedAmount} {token.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Wallet Balance</span>
              <span>{balance?.formatted || '0'} {token.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Borrow APY</span>
              <span className="text-red-500">{token.borrowAPY}%</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRepay}
              disabled={!amount || !isConnected || isTransactionPending}
              className="flex-1 button-gradient"
            >
              {isTransactionPending ? 'Repaying...' : 'Repay'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};