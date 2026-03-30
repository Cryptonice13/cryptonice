import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  RefreshCw,
  BarChart3,
  Target,
  Clock,
  Loader2,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import { useWatchlistDb } from '@/hooks/useWatchlistDb';
import { useAuth } from '@/hooks/useAuth';
import { TradingSignalCard } from '@/components/ai/TradingSignalCard';
import { MarketPredictionCard } from '@/components/ai/MarketPredictionCard';
import { MarketInsightsPanel } from '@/components/ai/MarketInsightsPanel';
import { WhaleActivityCard } from '@/components/ai/WhaleActivityCard';
import { MiniSparkline } from '@/components/ai/MiniSparkline';
import { PriceChart } from '@/components/ai/PriceChart';
import { formatPrice } from '@/lib/format';
import MobileBottomNav from '@/components/MobileBottomNav';
import AppHeader from '@/components/AppHeader';
import { useAIInsights } from '@/hooks/useAIInsights';
import { OptionChain } from '@/components/markets/OptionChain';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Markets() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [analysisSheetOpen, setAnalysisSheetOpen] = useState(false);
  const [marketTab, setMarketTab] = useState('spot');
  const [optionAssetId, setOptionAssetId] = useState<string>('');
  const [analysisSheetOpen, setAnalysisSheetOpen] = useState(false);

  const { assets, isLoading, refresh, lastUpdated } = useMarketData();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistDb(address, user?.id);
  const { savePrediction, saveSignal, saveWhaleActivity } = useAIInsights();

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
      <AppHeader activePage="markets" />

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

          {/* Market Insights Panel */}
          <MarketInsightsPanel assets={assets} selectedAssetId={selectedAsset} />

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
                        <th className="text-center p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">7d Chart</th>
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
                            {formatPrice(asset.price)}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`text-xs font-medium ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <div className="flex justify-center">
                              <MiniSparkline data={asset.sparkline} positive={asset.priceChange7d >= 0} />
                            </div>
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
                <div className="space-y-4">
                  {/* Price Chart */}
                  <PriceChart asset={selectedAssetData} />

                  <Tabs defaultValue="prediction" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="prediction" className="text-xs">
                        <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                        Prediction
                      </TabsTrigger>
                      <TabsTrigger value="signal" className="text-xs">
                        <Target className="w-3.5 h-3.5 mr-1.5" />
                        Signal
                      </TabsTrigger>
                      <TabsTrigger value="analysis" className="text-xs">
                        <Activity className="w-3.5 h-3.5 mr-1.5" />
                        Analysis
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="prediction" className="mt-4 space-y-2">
                      <MarketPredictionCard
                        symbol={selectedAssetData.symbol}
                        name={selectedAssetData.name}
                        currentPrice={selectedAssetData.price}
                        logo={selectedAssetData.logo}
                        onSave={savePrediction}
                      />
                      <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1.5" onClick={() => navigate('/insights')}>
                        View History <ArrowRight className="w-3 h-3" />
                      </Button>
                    </TabsContent>
                    <TabsContent value="signal" className="mt-4 space-y-2">
                      <TradingSignalCard
                        symbol={selectedAssetData.symbol}
                        name={selectedAssetData.name}
                        price={selectedAssetData.price}
                        logo={selectedAssetData.logo}
                        onSave={saveSignal}
                      />
                      <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1.5" onClick={() => navigate('/insights')}>
                        View History <ArrowRight className="w-3 h-3" />
                      </Button>
                    </TabsContent>
                    <TabsContent value="analysis" className="mt-4">
                      <Card className="glass-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-semibold">AI Deep Analysis</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get comprehensive technical & fundamental analysis with indicators, support/resistance, tokenomics, and risk assessment.
                        </p>
                        <Button
                          className="w-full gap-2"
                          onClick={() => navigate(`/analysis/${selectedAssetData.id}`)}
                        >
                          Full Analysis <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Insights Link */}
                  <Card
                    className="glass-card p-4 cursor-pointer hover:border-primary/40 transition-colors group"
                    onClick={() => window.location.href = '/insights'}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">AI Insights</h3>
                          <p className="text-[10px] text-muted-foreground">View saved predictions, signals & whale activity</p>
                        </div>
                      </div>
                      <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>

                  {/* Select Asset CTA */}
                  <Card className="glass-card p-6 text-center">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">Select an Asset</h3>
                    <p className="text-xs text-muted-foreground">
                      Tap on any asset for AI predictions and trading signals.
                    </p>
                  </Card>
                </div>
              )}

              {/* Whale Activity */}
              {selectedAssetData && (
                <div className="space-y-2">
                  <WhaleActivityCard
                    symbol={selectedAssetData.symbol}
                    name={selectedAssetData.name}
                    price={selectedAssetData.price}
                    onSave={saveWhaleActivity}
                  />
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1.5" onClick={() => navigate('/insights')}>
                    View History <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
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
            <div className="space-y-4 overflow-y-auto max-h-[calc(70vh-80px)]">
              {/* Price Chart */}
              <PriceChart asset={selectedAssetData} />

              <Tabs defaultValue="prediction" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="prediction" className="text-xs">
                    <BarChart3 className="w-3.5 h-3.5 mr-1" />
                    Predict
                  </TabsTrigger>
                  <TabsTrigger value="signal" className="text-xs">
                    <Target className="w-3.5 h-3.5 mr-1" />
                    Signal
                  </TabsTrigger>
                  <TabsTrigger value="whales" className="text-xs">
                    🐋 Whales
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs">
                    <Activity className="w-3.5 h-3.5 mr-1" />
                    Analysis
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="prediction" className="mt-4 space-y-2">
                  <MarketPredictionCard
                    symbol={selectedAssetData.symbol}
                    name={selectedAssetData.name}
                    currentPrice={selectedAssetData.price}
                    logo={selectedAssetData.logo}
                    onSave={savePrediction}
                  />
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1.5" onClick={() => { setAnalysisSheetOpen(false); navigate('/insights'); }}>
                    View History <ArrowRight className="w-3 h-3" />
                  </Button>
                </TabsContent>
                <TabsContent value="signal" className="mt-4 space-y-2">
                  <TradingSignalCard
                    symbol={selectedAssetData.symbol}
                    name={selectedAssetData.name}
                    price={selectedAssetData.price}
                    logo={selectedAssetData.logo}
                    onSave={saveSignal}
                  />
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1.5" onClick={() => { setAnalysisSheetOpen(false); navigate('/insights'); }}>
                    View History <ArrowRight className="w-3 h-3" />
                  </Button>
                </TabsContent>
                <TabsContent value="whales" className="mt-4 space-y-2">
                  <WhaleActivityCard
                    symbol={selectedAssetData.symbol}
                    name={selectedAssetData.name}
                    price={selectedAssetData.price}
                    onSave={saveWhaleActivity}
                  />
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1.5" onClick={() => { setAnalysisSheetOpen(false); navigate('/insights'); }}>
                    View History <ArrowRight className="w-3 h-3" />
                  </Button>
                </TabsContent>
                <TabsContent value="analysis" className="mt-4">
                  <Card className="glass-card p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">AI Deep Analysis</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Technical & fundamental analysis with detailed indicators and insights.
                    </p>
                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        setAnalysisSheetOpen(false);
                        navigate(`/analysis/${selectedAssetData.id}`);
                      }}
                    >
                      Full Analysis <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <MobileBottomNav />
    </div>
  );
}
