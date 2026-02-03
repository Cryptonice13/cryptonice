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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import { useWatchlistDb } from '@/hooks/useWatchlistDb';
import { TradingSignalCard } from '@/components/ai/TradingSignalCard';
import { MarketPredictionCard } from '@/components/ai/MarketPredictionCard';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function Markets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [analysisSheetOpen, setAnalysisSheetOpen] = useState(false);

  const { assets, isLoading, refresh, lastUpdated } = useMarketData();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistDb(address);

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
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s`;
    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins}m`;
  };

  const filteredAssets = assets.filter(
    asset =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAssetData = assets.find(a => a.id === selectedAsset);

  const handleAssetClick = (assetId: string) => {
    setSelectedAsset(assetId);
    // On mobile, open the analysis sheet
    if (window.innerWidth < 1024) {
      setAnalysisSheetOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 safe-area-top">
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">CryptoAI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/portfolio" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
            <Link to="/markets" className="text-sm font-medium text-primary">Markets</Link>
            <Link to="/alerts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Alerts</Link>
          </nav>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 px-2">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="text-xs hidden sm:inline">{formatAddress(address!)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
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
              <Button onClick={handleConnect} size="sm" className="button-gradient h-8 px-3 text-xs">
                <Wallet className="w-3.5 h-3.5 mr-1.5" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 sm:px-4 pt-14 pb-20 lg:pb-8">
        <div className="mt-4 space-y-4">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">Markets</h1>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-400 font-medium">Live</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3" />
                Updated {formatLastUpdated(lastUpdated)} ago
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading} className="h-9 w-9">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Asset List */}
            <div className="lg:col-span-2">
              <Card className="glass-card overflow-hidden">
                <div className="overflow-x-auto mobile-scroll">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Asset</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Price</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">24h</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">MCap</th>
                        <th className="text-center p-3 text-xs font-medium text-muted-foreground w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset, i) => (
                        <motion.tr
                          key={asset.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors ${
                            selectedAsset === asset.id ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => handleAssetClick(asset.id)}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img src={asset.logo} alt={asset.name} className="w-7 h-7 rounded-full" />
                              <div>
                                <p className="font-semibold text-sm">{asset.symbol}</p>
                                <p className="text-[10px] text-muted-foreground hidden sm:block">{asset.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono text-sm">
                            ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`text-xs font-medium ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-right hidden sm:table-cell text-xs text-muted-foreground">
                            {formatMarketCap(asset.marketCap)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (isInWatchlist(asset.id)) {
                                  await removeFromWatchlist(asset.id);
                                  toast({ title: 'Removed from watchlist' });
                                } else {
                                  await addToWatchlist(asset);
                                  toast({ title: 'Added to watchlist' });
                                }
                              }}
                            >
                              <Star className={`w-3.5 h-3.5 ${isInWatchlist(asset.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* AI Analysis Panel - Desktop */}
            <div className="hidden lg:block space-y-4">
              {selectedAssetData ? (
                <Tabs defaultValue="prediction" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="prediction" className="text-xs">
                      <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                      Prediction
                    </TabsTrigger>
                    <TabsTrigger value="signal" className="text-xs">
                      <Target className="w-3.5 h-3.5 mr-1.5" />
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
                <Card className="glass-card p-6 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">Select an Asset</h3>
                  <p className="text-xs text-muted-foreground">
                    Tap on any asset for AI predictions and trading signals.
                  </p>
                </Card>
              )}

              {/* Market Stats */}
              <Card className="glass-card p-4 space-y-3">
                <h3 className="font-semibold text-sm">Market Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total Assets</span>
                    <span className="text-sm font-semibold">{assets.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Gainers</span>
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      {assets.filter(a => a.priceChange24h > 0).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Losers</span>
                    <Badge className="bg-red-500/20 text-red-400 text-xs">
                      {assets.filter(a => a.priceChange24h < 0).length}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Analysis Sheet */}
      <Sheet open={analysisSheetOpen} onOpenChange={setAnalysisSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              {selectedAssetData && (
                <>
                  <img src={selectedAssetData.logo} alt={selectedAssetData.name} className="w-6 h-6 rounded-full" />
                  {selectedAssetData.symbol} Analysis
                </>
              )}
            </SheetTitle>
          </SheetHeader>
          {selectedAssetData && (
            <Tabs defaultValue="prediction" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prediction" className="text-xs">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Prediction
                </TabsTrigger>
                <TabsTrigger value="signal" className="text-xs">
                  <Target className="w-3.5 h-3.5 mr-1.5" />
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
          )}
        </SheetContent>
      </Sheet>

      <MobileBottomNav />
    </div>
  );
}
