import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  Bot,
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  RefreshCw,
  BarChart3,
  Target,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useMarketData, useWatchlist } from '@/hooks/useMarketData';
import { TradingSignalCard } from '@/components/ai/TradingSignalCard';
import { MarketPredictionCard } from '@/components/ai/MarketPredictionCard';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function Markets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const { assets, isLoading, refresh, lastUpdated } = useMarketData();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

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

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins}m ago`;
  };

  const filteredAssets = assets.filter(
    asset =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAssetData = assets.find(a => a.id === selectedAsset);

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
            <Link to="/portfolio" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
            <Link to="/markets" className="text-sm font-medium text-primary">Markets</Link>
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
              <Link to="/portfolio" className="block py-2 text-muted-foreground">Portfolio</Link>
              <Link to="/markets" className="block py-2 text-primary font-medium">Markets</Link>
              <Link to="/alerts" className="block py-2 text-muted-foreground">Alerts</Link>
            </nav>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-24 md:pb-8">
        <div className="mt-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Markets</h1>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Live</span>
                </div>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                Real-time crypto data from CoinGecko
                {lastUpdated && (
                  <span className="text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated {formatLastUpdated(lastUpdated)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Asset List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Asset</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">24h</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Market Cap</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset, i) => (
                        <motion.tr
                          key={asset.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors ${
                            selectedAsset === asset.id ? 'bg-muted/50' : ''
                          }`}
                          onClick={() => setSelectedAsset(asset.id)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={asset.logo} alt={asset.name} className="w-8 h-8 rounded-full" />
                              <div>
                                <p className="font-semibold">{asset.symbol}</p>
                                <p className="text-xs text-muted-foreground hidden sm:block">{asset.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono">
                            ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-right hidden sm:table-cell">
                            <span className={asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                            </span>
                          </td>
                          <td className="p-4 text-right hidden md:table-cell text-muted-foreground">
                            {formatMarketCap(asset.marketCap)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isInWatchlist(asset.id)) {
                                    removeFromWatchlist(asset.id);
                                    toast({ title: 'Removed from watchlist' });
                                  } else {
                                    addToWatchlist(asset);
                                    toast({ title: 'Added to watchlist' });
                                  }
                                }}
                              >
                                <Star className={`w-4 h-4 ${isInWatchlist(asset.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* AI Analysis Panel */}
            <div className="space-y-4">
              {selectedAssetData ? (
                <Tabs defaultValue="prediction" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="prediction">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Prediction
                    </TabsTrigger>
                    <TabsTrigger value="signal">
                      <Target className="w-4 h-4 mr-2" />
                      Signal
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="prediction" className="mt-4">
                    <MarketPredictionCard
                      symbol={selectedAssetData.symbol}
                      name={selectedAssetData.name}
                      currentPrice={selectedAssetData.price}
                      logo={selectedAssetData.logo}
                    />
                  </TabsContent>
                  <TabsContent value="signal" className="mt-4">
                    <TradingSignalCard
                      symbol={selectedAssetData.symbol}
                      name={selectedAssetData.name}
                      price={selectedAssetData.price}
                      logo={selectedAssetData.logo}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <Card className="glass-card p-8 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select an Asset</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any asset from the list to get AI-powered predictions and trading signals.
                  </p>
                </Card>
              )}

              {/* Market Stats */}
              <Card className="glass-card p-6 space-y-4">
                <h3 className="font-semibold">Market Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Assets</span>
                    <span className="font-semibold">{assets.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gainers</span>
                    <Badge className="bg-green-500/20 text-green-400">
                      {assets.filter(a => a.priceChange24h > 0).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Losers</span>
                    <Badge className="bg-red-500/20 text-red-400">
                      {assets.filter(a => a.priceChange24h < 0).length}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
