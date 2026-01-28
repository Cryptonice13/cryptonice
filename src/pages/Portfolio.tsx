import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  Bot,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Plus,
  Trash2,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  RefreshCw,
  DollarSign,
  Percent,
  Loader2,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMarketData, usePortfolio } from '@/hooks/useMarketData';
import { PortfolioAnalysisCard } from '@/components/ai/PortfolioAnalysisCard';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { Badge } from '@/components/ui/badge';

export default function Portfolio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ethBalance, refetch: refetchBalance } = useBalance({ address });
  const { balances: walletBalances, isLoading: balancesLoading } = useTokenBalances();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { assets, isLoading: marketLoading } = useMarketData();
  const { portfolio, addPosition, removePosition, getTotalValue, getTotalPnL } = usePortfolio();

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

  const walletTotalValue = walletHoldings.reduce((sum, h) => sum + h.value, 0);

  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    await refetchBalance();
    setTimeout(() => setIsRefreshing(false), 1000);
    toast({
      title: 'Balances Refreshed',
      description: 'Your wallet balances have been updated.',
    });
  };

  const handleConnect = async () => {
    try {
      connect({ connector: injected() });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleAddPosition = () => {
    const asset = assets.find(a => a.id === selectedAsset);
    if (asset && amount && buyPrice) {
      addPosition(asset, parseFloat(amount), parseFloat(buyPrice));
      toast({
        title: 'Position Added',
        description: `Added ${amount} ${asset.symbol} to your portfolio.`,
      });
      setAddDialogOpen(false);
      setSelectedAsset('');
      setAmount('');
      setBuyPrice('');
    }
  };

  const handleRemovePosition = (assetId: string, symbol: string) => {
    removePosition(assetId);
    toast({
      title: 'Position Removed',
      description: `Removed ${symbol} from your portfolio.`,
    });
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">CryptoAI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/portfolio" className="text-sm font-medium text-primary">Portfolio</Link>
            <Link to="/markets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Markets</Link>
            <Link to="/alerts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Alerts</Link>
          </nav>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Wallet className="w-4 h-4" />
                    <span className="hidden sm:inline">{formatAddress(address!)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => disconnect()} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleConnect} className="button-gradient">
                <Wallet className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50"
          >
            <nav className="container mx-auto px-4 py-4 space-y-2">
              <Link to="/dashboard" className="block py-2 text-muted-foreground">Dashboard</Link>
              <Link to="/portfolio" className="block py-2 text-primary font-medium">Portfolio</Link>
              <Link to="/markets" className="block py-2 text-muted-foreground">Markets</Link>
              <Link to="/alerts" className="block py-2 text-muted-foreground">Alerts</Link>
            </nav>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-24 md:pb-8">
        <div className="mt-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Portfolio</h1>
              <p className="text-muted-foreground">Track and analyze your crypto holdings</p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="button-gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Position
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                              {asset.symbol} - {asset.name}
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

          {/* Portfolio Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  totalPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {totalPnL >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  pnlPercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <Percent className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">P&L %</p>
                  <p className={`text-2xl font-bold ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Holdings List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Wallet Holdings Section */}
              {isConnected && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">Wallet Holdings</h2>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(address!)}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshBalances}
                      disabled={isRefreshing || balancesLoading}
                    >
                      {isRefreshing || balancesLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {balancesLoading ? (
                    <Card className="glass-card p-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Loading wallet balances...</p>
                    </Card>
                  ) : walletHoldings.length === 0 ? (
                    <Card className="glass-card p-6 text-center">
                      <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">No tokens found in wallet</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {walletHoldings.map((holding) => (
                        <motion.div
                          key={holding.symbol}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="glass-card p-4 border-primary/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                  <span className="text-sm font-bold">{holding.symbol.charAt(0)}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{holding.symbol}</p>
                                    <Badge variant="secondary" className="text-xs">On-chain</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{holding.name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-semibold">
                                  {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {holding.symbol}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ${holding.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                      <Card className="glass-card p-4 bg-primary/5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Wallet Total Value</span>
                          <span className="text-xl font-bold">
                            ${walletTotalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Portfolio Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Manual Positions</h2>
                {portfolio.length === 0 ? (
                  <Card className="glass-card p-8 text-center">
                    <PieChart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Manual Positions</h3>
                    <p className="text-muted-foreground mb-4">
                      Track positions from other wallets or exchanges.
                    </p>
                    <Button onClick={() => setAddDialogOpen(true)} className="button-gradient">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Position
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {portfolio.map((position) => {
                      const currentPrice = currentPrices.get(position.asset.id) || position.asset.price;
                      const currentValue = position.amount * currentPrice;
                      const costBasis = position.amount * position.avgBuyPrice;
                      const pnl = currentValue - costBasis;
                      const pnlPct = (pnl / costBasis) * 100;

                      return (
                        <motion.div
                          key={position.asset.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="glass-card p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={position.asset.logo} 
                                  alt={position.asset.name} 
                                  className="w-10 h-10 rounded-full"
                                />
                                <div>
                                  <p className="font-semibold">{position.asset.symbol}</p>
                                  <p className="text-sm text-muted-foreground">{position.asset.name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-semibold">{position.amount} {position.asset.symbol}</p>
                                <p className="text-sm text-muted-foreground">
                                  ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                                <p className={`text-sm ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePosition(position.asset.id, position.asset.symbol)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/50 text-sm">
                              <div>
                                <span className="text-muted-foreground">Avg Buy Price:</span>
                                <span className="ml-2 font-mono">${position.avgBuyPrice.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Current Price:</span>
                                <span className="ml-2 font-mono">${currentPrice.toLocaleString()}</span>
                              </div>
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
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">AI Analysis</h2>
              <PortfolioAnalysisCard portfolio={portfolio} />
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
