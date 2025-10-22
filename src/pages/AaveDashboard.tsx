import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '@/state/walletStore';
import { useAave, Reserve } from '@/hooks/useAave';
import { useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MarketOverview } from '@/components/aave/MarketOverview';
import { ReserveList } from '@/components/aave/ReserveList';
import { parseUnits } from 'ethers';

export default function AaveDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const chainId = useChainId();
  const { address, isConnected, connect } = useWalletStore();
  const {
    aaveMarkets,
    selectedMarket,
    setSelectedMarket,
    isLoading,
    error,
    fetchMarkets,
    supply,
    borrow,
    withdraw,
    repay,
  } = useAave();

  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'supply' | 'borrow' | 'withdraw' | 'repay' | null;
    reserve: Reserve | null;
  }>({ open: false, type: null, reserve: null });
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (chainId && isConnected) {
      fetchMarkets(chainId, address);
    }
  }, [chainId, isConnected, address, fetchMarkets]);

  const handleAction = async () => {
    if (!actionModal.reserve || !amount || !selectedMarket) return;

    setIsProcessing(true);
    try {
      const amountWei = parseUnits(amount, actionModal.reserve.underlyingToken.decimals);
      const assetAddress = actionModal.reserve.underlyingToken.address;

      switch (actionModal.type) {
        case 'supply':
          await supply(selectedMarket.address, assetAddress as any, amountWei, chainId!);
          toast({ title: 'Success', description: 'Supply transaction submitted' });
          break;
        case 'borrow':
          await borrow(selectedMarket.address, assetAddress as any, amountWei, chainId!);
          toast({ title: 'Success', description: 'Borrow transaction submitted' });
          break;
        case 'withdraw':
          await withdraw(selectedMarket.address, assetAddress as any, amountWei, chainId!);
          toast({ title: 'Success', description: 'Withdraw transaction submitted' });
          break;
        case 'repay':
          await repay(selectedMarket.address, assetAddress as any, amountWei, chainId!);
          toast({ title: 'Success', description: 'Repay transaction submitted' });
          break;
      }

      setActionModal({ open: false, type: null, reserve: null });
      setAmount('');
      
      // Refresh markets data
      if (chainId) {
        fetchMarkets(chainId, address);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Transaction failed',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to access Aave Protocol</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={async () => {
                try {
                  await connect();
                } catch (error: any) {
                  if (!error.message.includes("Opening MetaMask")) {
                    toast({
                      title: "Connection Failed",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                }
              }} 
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/finance')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Aave Protocol</h1>
                <p className="text-sm text-muted-foreground">Lending & Borrowing Markets</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Connected Address</p>
                <p className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Market Selector */}
        {aaveMarkets.length > 1 && (
          <div className="mb-6">
            <Label>Select Market</Label>
            <Select
              value={selectedMarket?.id}
              onValueChange={(value) => {
                const market = aaveMarkets.find(m => m.id === value);
                if (market) setSelectedMarket(market);
              }}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a market" />
              </SelectTrigger>
              <SelectContent>
                {aaveMarkets.map((market) => (
                  <SelectItem key={market.id} value={market.id}>
                    {market.name} - {market.chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => chainId && fetchMarkets(chainId, address)} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Market Content */}
        {!isLoading && selectedMarket && (
          <div className="space-y-6">
            <MarketOverview market={selectedMarket} />
            
            <ReserveList
              supplyReserves={selectedMarket.supplyReserves}
              borrowReserves={selectedMarket.borrowReserves}
              onSupply={(reserve) => setActionModal({ open: true, type: 'supply', reserve })}
              onBorrow={(reserve) => setActionModal({ open: true, type: 'borrow', reserve })}
              onWithdraw={(reserve) => setActionModal({ open: true, type: 'withdraw', reserve })}
              onRepay={(reserve) => setActionModal({ open: true, type: 'repay', reserve })}
            />
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Dialog open={actionModal.open} onOpenChange={(open) => !isProcessing && setActionModal({ open, type: null, reserve: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal.type?.charAt(0).toUpperCase()}{actionModal.type?.slice(1)} {actionModal.reserve?.underlyingToken.symbol}
            </DialogTitle>
            <DialogDescription>
              Enter the amount you want to {actionModal.type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
              />
              {actionModal.reserve?.userState && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {parseFloat(actionModal.reserve.userState.balance).toFixed(4)} {actionModal.reserve.underlyingToken.symbol}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAction}
                disabled={!amount || isProcessing}
                className="flex-1"
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {actionModal.type?.charAt(0).toUpperCase()}{actionModal.type?.slice(1)}
              </Button>
              <Button
                variant="outline"
                onClick={() => setActionModal({ open: false, type: null, reserve: null })}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
