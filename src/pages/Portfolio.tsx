import { useState, useMemo } from 'react';
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
  Search,
  CalendarIcon,
  X,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useMarketData, CryptoAsset } from '@/hooks/useMarketData';
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
import { cn } from '@/lib/utils';

export default function Portfolio() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: ethBalance, refetch: refetchBalance } = useBalance({ address });
  const { balances: walletBalances, isLoading: balancesLoading } = useTokenBalances();

  // Add position state
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sell state
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedSellPosition, setSelectedSellPosition] = useState<string | null>(null);
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

  const ethPrice = assets.find(a => a.symbol === 'ETH')?.price || 0;
  const usdcPrice = assets.find(a => a.symbol === 'USDC')?.price || 1;
  const usdtPrice = assets.find(a => a.symbol === 'USDT')?.price || 1;

  const walletHoldings = [
    ...(ethBalance && parseFloat(ethBalance.formatted) > 0 ? [{
      symbol: 'ETH', name: 'Ethereum',
      balance: parseFloat(ethBalance.formatted),
      value: parseFloat(ethBalance.formatted) * ethPrice,
      logo: '/lovable-uploads/ethereum-logo.png',
    }] : []),
    ...walletBalances.map(b => ({
      symbol: b.symbol, name: b.token?.name || b.symbol,
      balance: parseFloat(b.balance),
      value: parseFloat(b.balance) * (b.symbol === 'USDC' ? usdcPrice : b.symbol === 'USDT' ? usdtPrice : 0),
      logo: b.token?.logo || '/placeholder.svg',
    }))
  ];

  // Filtered assets for search
  const filteredAssets = useMemo(() => {
    if (!assetSearch.trim()) return assets.slice(0, 20);
    const q = assetSearch.toLowerCase();
    return assets.filter(a =>
      a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [assets, assetSearch]);

  // Computed values for form
  const parsedAmount = parseFloat(amount) || 0;
  const parsedPrice = parseFloat(buyPrice) || 0;
  const totalValue = parsedAmount * parsedPrice;
  const isFormValid = selectedAsset && parsedAmount > 0 && parsedPrice > 0;

  const handleSelectAsset = (asset: CryptoAsset) => {
    setSelectedAsset(asset);
    setBuyPrice(asset.price.toString());
    setAssetSearch('');
  };

  const handleClearAsset = () => {
    setSelectedAsset(null);
    setBuyPrice('');
    setAmount('');
    setAssetSearch('');
  };

  const handleQuickAmount = (val: string) => {
    setAmount(val);
  };

  const handleAddPosition = async () => {
    if (!isFormValid || !selectedAsset) return;
    setIsSubmitting(true);
    try {
      const success = await addPosition(selectedAsset, parsedAmount, parsedPrice, purchaseDate);
      if (success) {
        toast({
          title: 'Position Added',
          description: `Added ${parsedAmount} ${selectedAsset.symbol} at $${parsedPrice.toLocaleString()}.`,
        });
        setAddFormOpen(false);
        handleClearAsset();
        setPurchaseDate(undefined);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    await refetchBalance();
    setTimeout(() => setIsRefreshing(false), 1000);
    toast({ title: 'Balances Refreshed', description: 'Your wallet balances have been updated.' });
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleSellPosition = async () => {
    if (selectedSellPosition && sellAmount && sellPrice) {
      const position = portfolio.find(p => p.asset_id === selectedSellPosition);
      if (position) {
        const success = await sellPosition(selectedSellPosition, parseFloat(sellAmount), parseFloat(sellPrice));
        if (success) {
          toast({ title: 'Position Sold', description: `Sold ${sellAmount} ${position.asset_symbol}.` });
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
      toast({ title: 'Position Removed', description: `Removed ${symbol} from your portfolio.` });
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

  const currentPrices = new Map(assets.map(a => [a.id, a.price]));
  const portfolioTotalValue = getTotalValue(currentPrices);
  const totalPnL = getTotalPnL(currentPrices);
  const pnlPercent = portfolio.length > 0 
    ? (totalPnL / (portfolioTotalValue - totalPnL)) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="portfolio" />

      <main className="px-3 sm:px-4 pt-14 pb-20 lg:pb-8">
        <div className="mt-4 space-y-4">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">Portfolio</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Track your crypto holdings</p>
            </div>
            <Button size="sm" className="button-gradient h-9 px-3" onClick={() => setAddFormOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Add Position</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          {/* Portfolio Stats */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
            <Card className="glass-card p-4 min-w-[140px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Total Value</p>
                  <p className="text-lg font-bold truncate">${portfolioTotalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-4 min-w-[140px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  totalPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {totalPnL >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
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

          <PerformanceChart transactions={transactions} currentPrices={currentPrices} portfolio={portfolio} />

          <div className="space-y-4">
            {/* Wallet Holdings */}
            {isConnected && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold">Wallet</h2>
                    <Badge variant="outline" className="text-[10px] px-1.5">{formatAddress(address!)}</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefreshBalances} disabled={isRefreshing || balancesLoading} className="h-8">
                    {isRefreshing || balancesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
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

            {/* Portfolio Positions */}
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
                    <SheetHeader><SheetTitle>Transaction History</SheetTitle></SheetHeader>
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
                                    <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
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
                  <p className="text-xs text-muted-foreground mb-3">Add your first position to start tracking.</p>
                  <Button size="sm" className="button-gradient" onClick={() => setAddFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" /> Add Position
                  </Button>
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
                      <motion.div key={position.asset_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="glass-card p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={position.asset_logo || '/placeholder.svg'} alt={position.asset_name} className="w-9 h-9 rounded-full" />
                              <div>
                                <p className="font-semibold text-sm">{position.asset_symbol}</p>
                                <p className="text-[10px] text-muted-foreground">{position.amount.toFixed(4)} × ${position.avg_buy_price.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm font-semibold">${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                              <p className={`text-[10px] font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => openSellDialog(position.asset_id)}>Sell</Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemovePosition(position.asset_id, position.asset_symbol)}>
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

          {/* AI Analysis */}
          <PortfolioAnalysisCard
            portfolio={portfolio.map(p => ({
              asset: { symbol: p.asset_symbol, name: p.asset_name, price: currentPrices.get(p.asset_id) || 0 },
              amount: p.amount,
              avgBuyPrice: p.avg_buy_price,
            }))}
            onSave={(analysis, portfolioData) => {
              savePortfolioAnalysis(analysis.healthScore, analysis.riskLevel, analysis.diversification, portfolioData, analysis);
            }}
          />
        </div>
      </main>

      {/* ===== Add Position Dialog (Redesigned) ===== */}
      <Dialog open={addFormOpen} onOpenChange={(open) => { setAddFormOpen(open); if (!open) handleClearAsset(); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-border">
            <DialogTitle className="text-base">Add New Position</DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Step 1: Select Asset */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</Label>
              {selectedAsset ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <img src={selectedAsset.logo} alt={selectedAsset.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-semibold text-sm">{selectedAsset.symbol}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedAsset.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-muted-foreground">${selectedAsset.price.toLocaleString()}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearAsset}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assets (BTC, Ethereum...)"
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  <ScrollArea className="h-[180px] rounded-lg border border-border">
                    {marketLoading ? (
                      <div className="flex items-center justify-center h-full py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredAssets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">No assets found</div>
                    ) : (
                      <div className="p-1">
                        {filteredAssets.map((asset) => (
                          <button
                            key={asset.id}
                            onClick={() => handleSelectAsset(asset)}
                            className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-accent/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={asset.logo} alt={asset.name} className="w-7 h-7 rounded-full" />
                              <div>
                                <p className="font-medium text-sm">{asset.symbol}</p>
                                <p className="text-[10px] text-muted-foreground">{asset.name}</p>
                              </div>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">${asset.price.toLocaleString()}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Step 2: Amount & Price (shown after asset selection) */}
            {selectedAsset && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={cn("h-10 font-mono", parsedAmount <= 0 && amount.length > 0 && "border-destructive")}
                  />
                  <div className="flex gap-1.5">
                    {['0.1', '0.5', '1', '5', '10'].map(v => (
                      <Button key={v} variant="outline" size="sm" className="h-7 px-2.5 text-xs flex-1" onClick={() => handleQuickAmount(v)}>{v}</Button>
                    ))}
                  </div>
                  {parsedAmount <= 0 && amount.length > 0 && (
                    <p className="text-[10px] text-destructive">Amount must be greater than 0</p>
                  )}
                </div>

                {/* Buy Price */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Buy Price ($)</Label>
                    <button
                      onClick={() => setBuyPrice(selectedAsset.price.toString())}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Use current: ${selectedAsset.price.toLocaleString()}
                    </button>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className={cn("h-10 font-mono", parsedPrice <= 0 && buyPrice.length > 0 && "border-destructive")}
                  />
                  {parsedPrice <= 0 && buyPrice.length > 0 && (
                    <p className="text-[10px] text-destructive">Price must be greater than 0</p>
                  )}
                </div>

                {/* Purchase Date (optional) */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !purchaseDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {purchaseDate ? format(purchaseDate, "PPP") : <span>Today (default)</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={purchaseDate}
                        onSelect={setPurchaseDate}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Live Total Preview */}
                {parsedAmount > 0 && parsedPrice > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Total Value</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <p className="text-xl font-bold font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {parsedAmount} {selectedAsset.symbol} × ${parsedPrice.toLocaleString()}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Submit button */}
          {selectedAsset && (
            <div className="p-4 pt-3 border-t border-border">
              <Button
                onClick={handleAddPosition}
                className="w-full button-gradient h-11"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add to Portfolio
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Sell Position</DialogTitle></DialogHeader>
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
              <Input type="number" placeholder="0.00" value={sellAmount} onChange={(e) => setSellAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sell Price ($)</Label>
              <Input type="number" placeholder="0.00" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
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
