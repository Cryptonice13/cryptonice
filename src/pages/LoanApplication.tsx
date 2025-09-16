import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useWalletStore } from "@/state/walletStore";
import { useLendingPool } from "@/hooks/useLendingPool";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { SUPPORTED_TOKENS } from "@/config/tokens";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import { useAccount } from 'wagmi';
import { formatCurrency } from "@/lib/format";

const LoanApplication = () => {
  const [selectedAsset, setSelectedAsset] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { address, connect } = useWalletStore();
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { borrow, getUserAccountData } = useLendingPool();
  const { balances } = useTokenBalances();
  
  const [accountData, setAccountData] = useState({
    totalCollateral: '0',
    totalDebt: '0',
    healthFactor: '0',
    availableBorrows: '0',
    liquidationThreshold: '80',
    ltv: '0'
  });

  // Available assets to borrow
  const borrowableAssets = [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', apy: '3.2', icon: '⟠' },
    { symbol: 'USDC', address: CONTRACT_ADDRESSES.USDC, apy: '5.8', icon: '💲' },
    { symbol: 'USDT', address: CONTRACT_ADDRESSES.USDT, apy: '4.9', icon: '₮' }
  ];

  useEffect(() => {
    const fetchAccountData = async () => {
      if (address) {
        try {
          const data = await getUserAccountData();
          setAccountData(data);
        } catch (error) {
          console.error('Failed to fetch account data:', error);
        }
      }
    };

    fetchAccountData();
  }, [address, getUserAccountData]);

  // Ensure walletStore is initialized when wagmi is connected
  useEffect(() => {
    if (wagmiIsConnected && wagmiAddress && !address) {
      connect().catch(() => {/* ignore */});
    }
  }, [wagmiIsConnected, wagmiAddress, address, connect]);

  const calculateNewHealthFactor = () => {
    if (!borrowAmount || !selectedAsset) return parseFloat(accountData.healthFactor);
    
    const currentDebt = parseFloat(accountData.totalDebt);
    const newDebt = currentDebt + parseFloat(borrowAmount);
    const collateral = parseFloat(accountData.totalCollateral);
    
    if (collateral === 0) return 0;
    
    // Simplified calculation - in reality this would need asset prices
    const liquidationThreshold = parseFloat(accountData.liquidationThreshold) / 100;
    return (collateral * liquidationThreshold) / newDebt;
  };

  const getMaxBorrowAmount = () => {
    const collateral = parseFloat(accountData.totalCollateral);
    const currentDebt = parseFloat(accountData.totalDebt);
    const ltv = 0.75; // 75% LTV ratio
    
    const maxBorrow = (collateral * ltv) - currentDebt;
    return Math.max(0, maxBorrow);
  };

  const handleBorrow = async () => {
    if (!wagmiIsConnected || !wagmiAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to borrow",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAsset || !borrowAmount) {
      toast({
        title: "Missing information",
        description: "Please select an asset and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const newHealthFactor = calculateNewHealthFactor();
    if (newHealthFactor < 1.1) {
      toast({
        title: "Insufficient collateral",
        description: "This would put your health factor below safe levels",
        variant: "destructive",
      });
      return;
    }

    setIsTransactionPending(true);
    try {
      // Find the asset address
      const asset = borrowableAssets.find(a => a.symbol === selectedAsset);
      if (!asset) throw new Error('Asset not found');

      await borrow(asset.address, borrowAmount, 18);

      toast({
        title: "Borrow successful",
        description: `Successfully borrowed ${borrowAmount} ${selectedAsset}`,
      });

      // Reset form
      setSelectedAsset('');
      setBorrowAmount('');
      
      // Refresh account data
      const data = await getUserAccountData();
      setAccountData(data);

    } catch (error) {
      console.error('Borrow failed:', error);
      toast({
        title: "Borrow failed",
        description: "Failed to complete borrow transaction",
        variant: "destructive",
      });
    } finally {
      setIsTransactionPending(false);
    }
  };

  const getHealthFactorColor = (hf: number) => {
    if (hf >= 2) return 'text-green-500';
    if (hf >= 1.5) return 'text-yellow-500';
    if (hf >= 1.1) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthFactorIcon = (hf: number) => {
    if (hf >= 2) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (hf >= 1.1) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  if (!wagmiIsConnected || !wagmiAddress) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate("/home")}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground">Please connect your wallet to start borrowing</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/home")}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold mb-2">Borrow Assets</h1>
            <p className="text-muted-foreground">Borrow crypto assets against your collateral</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Account Overview */}
            <div className="lg:col-span-1">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Your Position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Collateral</span>
                    <span className="font-medium">{formatCurrency(accountData.totalCollateral)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Borrowed</span>
                    <span className="font-medium">{formatCurrency(accountData.totalDebt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available to Borrow</span>
                    <span className="font-medium text-green-500">{formatCurrency(getMaxBorrowAmount().toString())}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Health Factor</span>
                      <div className="flex items-center gap-2">
                        {getHealthFactorIcon(parseFloat(accountData.healthFactor))}
                        <span className={`font-medium ${getHealthFactorColor(parseFloat(accountData.healthFactor))}`}>
                          {parseFloat(accountData.healthFactor).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Above 1.0 is safe. Below 1.0 risks liquidation.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Collateral Positions */}
              <Card>
                <CardHeader>
                  <CardTitle>Collateral Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  {balances.length > 0 ? (
                    <div className="space-y-3">
                      {balances.map((balance) => (
                        <div key={balance.symbol} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {balance.symbol === 'ETH' ? '⟠' : 
                               balance.symbol === 'USDC' ? '💲' : 
                               balance.symbol === 'USDT' ? '₮' : '💰'}
                            </span>
                            <span className="font-medium">{balance.symbol}</span>
                          </div>
                          <span className="text-sm">{parseFloat(balance.balance).toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No collateral deposited. Go to Home to deposit assets.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Borrow Interface */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Borrow Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Asset Selection */}
                  <div>
                    <Label htmlFor="asset">Select Asset to Borrow</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {borrowableAssets.map((asset) => (
                        <Card 
                          key={asset.symbol}
                          className={`cursor-pointer transition-all hover:border-primary ${
                            selectedAsset === asset.symbol ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedAsset(asset.symbol)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">{asset.icon}</div>
                            <div className="font-medium">{asset.symbol}</div>
                            <div className="text-sm text-muted-foreground">APY {asset.apy}%</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <Label htmlFor="amount">Amount to Borrow</Label>
                    <div className="relative mt-2">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={borrowAmount}
                        onChange={(e) => setBorrowAmount(e.target.value)}
                        className="pr-20"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                        onClick={() => setBorrowAmount(getMaxBorrowAmount().toString())}
                      >
                        MAX
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum available: {formatCurrency(getMaxBorrowAmount().toString())}
                    </p>
                  </div>

                  {/* Health Factor Impact */}
                  {borrowAmount && selectedAsset && (
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Health Factor Impact</span>
                          <div className="flex items-center gap-2">
                            <span className={getHealthFactorColor(parseFloat(accountData.healthFactor))}>
                              {parseFloat(accountData.healthFactor).toFixed(2)}
                            </span>
                            <TrendingDown className="w-4 h-4 text-muted-foreground" />
                            <span className={getHealthFactorColor(calculateNewHealthFactor())}>
                              {calculateNewHealthFactor().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Borrow Button */}
                  <Button 
                    onClick={handleBorrow}
                    disabled={!selectedAsset || !borrowAmount || isTransactionPending || parseFloat(borrowAmount) <= 0}
                    className="w-full"
                    size="lg"
                  >
                    {isTransactionPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing Transaction...
                      </>
                    ) : (
                      `Borrow ${borrowAmount || '0'} ${selectedAsset || 'Asset'}`
                    )}
                  </Button>

                  {/* Warning */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-500 mb-1">Important Notes:</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Keep your health factor above 1.1 to avoid liquidation</li>
                          <li>• Interest accrues continuously on borrowed amounts</li>
                          <li>• You can repay anytime to improve your health factor</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;