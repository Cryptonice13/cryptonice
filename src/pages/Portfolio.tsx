import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useBalance } from 'wagmi';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  RefreshCw,
  DollarSign,
  Percent,
  Loader2,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import { usePortfolioDb } from '@/hooks/usePortfolioDb';
import { useAuth } from '@/hooks/useAuth';
import { PortfolioAnalysisCard } from '@/components/ai/PortfolioAnalysisCard';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useAIInsights } from '@/hooks/useAIInsights';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppHeader from '@/components/AppHeader';
import { PerformanceChart } from '@/components/portfolio/PerformanceChart';

export default function Portfolio() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: ethBalance, refetch: refetchBalance } = useBalance({ address });
  const { balances: walletBalances, isLoading: balancesLoading } = useTokenBalances();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedSellPosition, setSelectedSellPosition] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const { savePortfolioAnalysis } = useAIInsights();

  const { assets, isLoading: marketLoading } = useMarketData();
  const { 
    portfolio, 
    transactions, 
    isLoading: portfolioLoading,
    addPosition, 
    sellPosition,
    removePosition, 
    getTotalValue, 
    getTotalPnL 
  } = usePortfolioDb(address, user?.id);

  // Get ETH price from market data
  const ethPrice = assets.find(a => a.symbol === 'ETH')?.price || 0;
  const usdcPrice = assets.find(a => a.symbol === 'USDC')?.price || 1;
  const usdtPrice = assets.find(a => a.symbol === 'USDT')?.price || 1;

  // Calculate wallet holdings value
  const walletHoldings = [
    ...(ethBalance && parseFloat(ethBalance.formatted) > 0 ? [{
      symbol: 'ETH',
      name: 'Ethereum',
      balance: parseFloat(ethBalance.formatted),
      value: parseFloat(ethBalance.formatted) * ethPrice,
      logo: '/lovable-uploads/ethereum-logo.png',
    }] : []),
    ...walletBalances.map(b => ({
      symbol: b.symbol,
      name: b.token?.name || b.symbol,
      balance: parseFloat(b.balance),
      value: parseFloat(b.balance) * (b.symbol === 'USDC' ? usdcPrice : b.symbol === 'USDT' ? usdtPrice : 0),
      logo: b.token?.logo || '/placeholder.svg',
    }))
  ];

  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    await refetchBalance();
    setTimeout(() => setIsRefreshing(false), 1000);
    toast({
      title: 'Balances Refreshed',
      description: 'Your wallet balances have been updated.',
    });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleAddPosition = async () => {
    const asset = assets.find(a => a.id === selectedAsset);
    if (asset && amount && buyPrice) {
      const success = await addPosition(asset, parseFloat(amount), parseFloat(buyPrice));
      if (success) {
        toast({
          title: 'Position Added',
          description: `Added ${amount} ${asset.symbol} to your portfolio.`,
        });
        setAddDialogOpen(false);
        setSelectedAsset('');
        setAmount('');
        setBuyPrice('');
      }
    }
  };

  const handleSellPosition = async () => {
    if (selectedSellPosition && sellAmount && sellPrice) {
      const position = portfolio.find(p => p.asset_id === selectedSellPosition);
      if (position) {
        const success = await sellPosition(selectedSellPosition, parseFloat(sellAmount), parseFloat(sellPrice));
        if (success) {
          toast({
            title: 'Position Sold',
            description: `Sold ${sellAmount} ${position.asset_symbol}.`,
          });
          setSellDialogOpen(false);
          setSelectedSellPosition(null);
          setSellAmount('');
          setSellPrice('');
        }
      }
    }
  };

  const handleRemovePosition = async (assetId: string, symbol: string) => {
    const success = await removePosition(assetId);
    if (success) {
      toast({
        title: 'Position Removed',
        description: `Removed ${symbol} from your portfolio.`,
      });
    }
  };

  const openSellDialog = (assetId: string) => {
    const position = portfolio.find(p => p.asset_id === assetId);
    if (position) {
      setSelectedSellPosition(assetId);
      const currentPrice = currentPrices.get(assetId) || 0;
      setSellPrice(currentPrice.toString());
      setSellDialogOpen(true);
    }
  };

  // Calculate current prices map
  const currentPrices = new Map(assets.map(a => [a.id, a.price]));
  const totalValue = getTotalValue(currentPrices);
  const totalPnL = getTotalPnL(currentPrices);
  const pnlPercent = portfolio.length > 0 
    ? (totalPnL / (totalValue - totalPnL)) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="portfolio" />

      {/* Main Content */}
      <main className="px-3 sm:px-4 pt-14 pb-20 lg:pb-8">
        <div className="mt-4 space-y-4">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">Portfolio</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Track your crypto holdings</p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="button-gradient h-9 px-3">
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Add Position</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Position</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map(asset => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div className="flex items-center gap-2">
                              <img src={asset.logo} alt={asset.name} className="w-5 h-5 rounded-full" />
                              {asset.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Buy Price ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddPosition} className="w-full button-gradient" disabled={!selectedAsset || !amount || !buyPrice}>
                    Add to Portfolio
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Portfolio Stats - Horizontal scroll on mobile */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
            <Card className="glass-card p-4 min-w-[140px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Total Value</p>
                  <p className="text-lg font-bold truncate">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-4 min-w-[140px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  totalPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {totalPnL >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Total P&L</p>
                  <p className={`text-lg font-bold truncate ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-4 min-w-[120px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  pnlPercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <Percent className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">P&L %</p>
                  <p className={`text-lg font-bold ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Chart */}
          <PerformanceChart transactions={transactions} currentPrices={currentPrices} />

          {/* Rest of portfolio content */}
          <div className="space-y-4">
              {/* Wallet Holdings Section */}
              {isConnected && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-semibold">Wallet</h2>
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {formatAddress(address!)}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshBalances}
                      disabled={isRefreshing || balancesLoading}
                      className="h-8"
                    >
                      {isRefreshing || balancesLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>

                  {balancesLoading ? (
                    <Card className="glass-card p-6 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-xs text-muted-foreground">Loading balances...</p>
                    </Card>
                  ) : walletHoldings.length === 0 ? (
                    <Card className="glass-card p-4 text-center">
                      <Wallet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">No tokens found</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {walletHoldings.map((holding) => (
                        <Card key={holding.symbol} className="glass-card p-3 border-primary/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <span className="text-xs font-bold">{holding.symbol.charAt(0)}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-sm">{holding.symbol}</p>
                                  <Badge variant="outline" className="text-[10px] px-1 h-4">On-chain</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground">{holding.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm font-semibold">{holding.balance.toFixed(4)}</p>
                              <p className="text-[10px] text-muted-foreground">${holding.value.toFixed(2)}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Portfolio Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold">Portfolio Positions</h2>
                  <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">History</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[90%] max-w-md">
                      <SheetHeader>
                        <SheetTitle>Transaction History</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                        {transactions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No transactions yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {transactions.map((tx) => (
                              <Card key={tx.id} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      tx.transaction_type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                                    }`}>
                                      {tx.transaction_type === 'buy' ? (
                                        <ArrowDownRight className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm capitalize">{tx.transaction_type} {tx.asset_symbol}</p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-sm">{tx.amount} {tx.asset_symbol}</p>
                                    <p className="text-[10px] text-muted-foreground">${tx.total_value.toFixed(2)}</p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>

                {portfolioLoading ? (
                  <Card className="glass-card p-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Loading portfolio...</p>
                  </Card>
                ) : portfolio.length === 0 ? (
                  <Card className="glass-card p-6 text-center">
                    <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No Positions Yet</h3>
                    <p className="text-xs text-muted-foreground">Add your first position to start tracking.</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {portfolio.map((position, i) => {
                      const currentPrice = currentPrices.get(position.asset_id) || 0;
                      const currentValue = position.amount * currentPrice;
                      const costBasis = position.amount * position.avg_buy_price;
                      const pnl = currentValue - costBasis;
                      const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

                      return (
                        <motion.div
                          key={position.asset_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card className="glass-card p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={position.asset_logo || '/placeholder.svg'}
                                  alt={position.asset_name}
                                  className="w-9 h-9 rounded-full"
                                />
                                <div>
                                  <p className="font-semibold text-sm">{position.asset_symbol}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {position.amount.toFixed(4)} × ${position.avg_buy_price.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-sm font-semibold">
                                  ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                                <p className={`text-[10px] font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-7 text-xs"
                                onClick={() => openSellDialog(position.asset_id)}
                              >
                                Sell
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleRemovePosition(position.asset_id, position.asset_symbol)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

          </div>

          {/* AI Analysis - Full Width */}
          <PortfolioAnalysisCard
            portfolio={portfolio.map(p => ({
              asset: {
                symbol: p.asset_symbol,
                name: p.asset_name,
                price: currentPrices.get(p.asset_id) || 0,
              },
              amount: p.amount,
              avgBuyPrice: p.avg_buy_price,
            }))}
            onSave={(analysis, portfolioData) => {
              savePortfolioAnalysis(
                analysis.healthScore,
                analysis.riskLevel,
                analysis.diversification,
                portfolioData,
                analysis,
              );
            }}
          />
        </div>
      </main>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sell Position</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedSellPosition && (() => {
              const pos = portfolio.find(p => p.asset_id === selectedSellPosition);
              return pos ? (
                <div className="bg-muted/30 p-3 rounded-lg text-sm">
                  <p>Selling <strong>{pos.asset_symbol}</strong></p>
                  <p className="text-xs text-muted-foreground">Available: {pos.amount}</p>
                </div>
              ) : null;
            })()}
            <div className="space-y-2">
              <Label>Amount to Sell</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sell Price ($)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
              />
            </div>
            <Button onClick={handleSellPosition} className="w-full button-gradient" disabled={!sellAmount || !sellPrice}>
              Confirm Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
}
