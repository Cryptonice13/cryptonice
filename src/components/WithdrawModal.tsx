import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getTokenBySymbol } from '@/config/tokens';
import { useLendingPool } from '@/hooks/useLendingPool';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency } from '@/lib/format';
import { Info } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenSymbol: string;
  suppliedAmount?: string;
}

export const WithdrawModal = ({ open, onOpenChange, tokenSymbol, suppliedAmount = '0' }: WithdrawModalProps) => {
  const [amount, setAmount] = useState('');
  const { withdraw, isTransactionPending } = useLendingPool();
  const { isConnected } = useWallet();
  
  const token = getTokenBySymbol(tokenSymbol);
  
  if (!token) return null;

  const handleWithdraw = async () => {
    if (!amount || !isConnected) return;
    
    try {
      await withdraw(token.address, amount);
      setAmount('');
      onOpenChange(false);
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  const handleMaxClick = () => {
    setAmount(suppliedAmount);
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
            Withdraw {token.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Withdrawing collateral may affect your borrowing capacity and health factor.
            </AlertDescription>
          </Alert>

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
              <span>Supplied Amount</span>
              <span>{suppliedAmount} {token.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Supply APY</span>
              <span className="text-green-500">{token.supplyAPY}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Health Factor</span>
              <span className="text-green-500">2.45</span>
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
              onClick={handleWithdraw}
              disabled={!amount || !isConnected || isTransactionPending}
              className="flex-1"
              variant="outline"
            >
              {isTransactionPending ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};