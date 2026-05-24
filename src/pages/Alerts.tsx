import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Wallet,
  Bell,
  Star,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  History,
  Loader2,
  X,
  CheckCheck,
  Eye,
  Clock,
  BarChart3,
  Sparkles,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import { useWatchlistDb } from '@/hooks/useWatchlistDb';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNav from '@/components/MobileBottomNav';
import AppHeader from '@/components/AppHeader';
import { SmartAlertSuggestions } from '@/components/ai/SmartAlertSuggestions';
import { ConditionalAlertBuilder } from '@/components/alerts/ConditionalAlertBuilder';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/format';
import { invokeCryptoAI, readCryptoAIError } from '@/lib/cryptoAIClient';

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Alerts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [addAssetSearch, setAddAssetSearch] = useState('');

  // History filters
  const [historyAssetFilter, setHistoryAssetFilter] = useState('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  // Single-asset AI alert generation
  const [aiGeneratingFor, setAiGeneratingFor] = useState<string | null>(null);
  const [aiAssetSuggestions, setAiAssetSuggestions] = useState<{
    asset_id: string;
    suggestions: { type: string; price: number; reasoning: string; confidence: number }[];
  } | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [applyingAiIdx, setApplyingAiIdx] = useState<number | null>(null);

  const { assets } = useMarketData();
  const { 
    watchlist, 
    alertHistory, 
    unreadAlertCount,
    isLoading,
    addToWatchlist, 
    removeFromWatchlist, 
    setAlert,
    clearAlert,
    checkAlerts,
    markAlertRead,
    markAllAlertsRead,
  } = useWatchlistDb(address, user?.id);

  const handleAddToWatchlist = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      const success = await addToWatchlist(asset);
      if (success) {
        toast({ title: 'Added to watchlist', description: `${asset.symbol} added to your watchlist.` });
      }
    }
  };

  const currentPrices = new Map(assets.map(a => [a.id, a.price]));

  // Generate AI alerts for a single asset
  const generateAiForAsset = useCallback(async (assetId: string, assetSymbol: string, currentPrice: number) => {
    setAiGeneratingFor(assetId);
    setAiAssetSuggestions(null);
    setAiDialogOpen(true);

    try {
      const response = await invokeCryptoAI({
        type: 'alert_suggestions',
        messages: [{ role: 'user', content: `Suggest price alerts for ${assetSymbol}` }],
        context: [{ symbol: assetSymbol, asset_id: assetId, currentPrice }],
        walletAddress: address,
      });

      if (!response.ok) throw new Error(await readCryptoAIError(response));
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        const cleaned = content.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
        const parsed = JSON.parse(cleaned);
        const suggestionsArray = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
        const assetData = suggestionsArray[0];
        const subs = assetData?.suggestions || [];

        setAiAssetSuggestions({ asset_id: assetId, suggestions: subs });

        const inserts = subs.map((s: any) => ({
          user_id: user?.id || null,
          wallet_address: address || null,
          asset_id: assetId,
          asset_symbol: assetSymbol,
          suggestion_type: s.type,
          target_price: s.price,
          reasoning: s.reasoning || null,
          confidence: s.confidence || 0,
          status: 'active',
        }));
        if (inserts.length > 0) {
          await supabase.from('ai_alert_suggestions' as any).insert(inserts);
        }
      }
    } catch (err) {
      console.error('AI single asset error:', err);
      toast({ title: 'Failed to generate AI alerts', variant: 'destructive' });
    } finally {
      setAiGeneratingFor(null);
    }
  }, [user, address, toast]);

  const applyAiSuggestion = useCallback(async (assetId: string, price: number, type: 'above' | 'below', idx: number) => {
    setApplyingAiIdx(idx);
    try {
      await setAlert(assetId, price, type);
      toast({ title: 'Alert applied!' });
      setAiDialogOpen(false);
      setAiAssetSuggestions(null);
    } finally {
      setApplyingAiIdx(null);
    }
  }, [setAlert, toast]);
  
  useEffect(() => {
    if (watchlist.length > 0 && assets.length > 0) {
      checkAlerts(currentPrices);
    }
  }, [assets]);

  const watchlistWithPrices = watchlist.map(item => {
    const currentAsset = assets.find(a => a.id === item.asset_id);
    return {
      ...item,
      currentPrice: currentAsset?.price || 0,
      priceChange24h: currentAsset?.priceChange24h || 0,
    };
  });

  const triggeredAlerts = watchlistWithPrices.filter(item => item.alert_triggered);

  // History analytics
  const historyStats = useMemo(() => {
    const total = alertHistory.length;
    const unread = alertHistory.filter(a => !a.is_read).length;
    const assetCounts = new Map<string, number>();
    alertHistory.forEach(a => {
      assetCounts.set(a.asset_symbol, (assetCounts.get(a.asset_symbol) || 0) + 1);
    });
    let topAsset = '—';
    let topCount = 0;
    assetCounts.forEach((count, symbol) => {
      if (count > topCount) { topAsset = symbol; topCount = count; }
    });
    const lastTriggered = alertHistory.length > 0 ? formatRelativeTime(alertHistory[0].triggered_at) : '—';
    return { total, unread, topAsset, topCount, lastTriggered };
  }, [alertHistory]);

  // Unique asset symbols for filter
  const historyAssets = useMemo(() => {
    return [...new Set(alertHistory.map(a => a.asset_symbol))];
  }, [alertHistory]);

  // Filtered history
  const filteredHistory = useMemo(() => {
    return alertHistory.filter(a => {
      if (historyAssetFilter !== 'all' && a.asset_symbol !== historyAssetFilter) return false;
      if (historyTypeFilter !== 'all' && a.alert_type !== historyTypeFilter) return false;
      if (historyStatusFilter === 'unread' && a.is_read) return false;
      if (historyStatusFilter === 'read' && !a.is_read) return false;
      return true;
    });
  }, [alertHistory, historyAssetFilter, historyTypeFilter, historyStatusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="alerts" />

      <main className="px-3 sm:px-4 pt-14 pb-20 lg:pb-8">
        <div className="mt-4 space-y-4">
          {/* Page Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Alerts & Watchlist</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Track favorites and set price alerts</p>
          </div>

          {/* Triggered Alerts Banner */}
          {triggeredAlerts.length > 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/50 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-yellow-400 text-sm">
                    {triggeredAlerts.length} Alert{triggeredAlerts.length > 1 ? 's' : ''} Triggered!
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {triggeredAlerts.map(a => a.asset_symbol).join(', ')}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {!(user || isConnected) ? (
            <Card className="glass-card p-6 text-center">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">Sign In Required</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Sign in to save your watchlist and alerts.
              </p>
            </Card>
          ) : isLoading ? (
            <Card className="glass-card p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading watchlist...</p>
            </Card>
          ) : (
            <Tabs defaultValue="watchlist" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="watchlist" className="text-xs sm:text-sm relative">
                  <Star className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Watchlist</span>
                  <span className="sm:hidden">Watch</span>
                  <span className="ml-1 text-[10px] opacity-70">({watchlist.length})</span>
                  {unreadAlertCount > 0 && (
                    <span className="ml-1 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                      {unreadAlertCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs sm:text-sm">
                  <Bell className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">AI Alerts</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
                <TabsTrigger value="add" className="text-xs sm:text-sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Add Assets</span>
                  <span className="sm:hidden">Add</span>
                </TabsTrigger>
              </TabsList>


              {/* ===== WATCHLIST TAB ===== */}
              <TabsContent value="watchlist" className="mt-4">
                {watchlist.length === 0 ? (
                  <Card className="glass-card p-6 text-center">
                    <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">Watchlist is Empty</h3>
                    <p className="text-xs text-muted-foreground">
                      Add assets to track prices and set alerts.
                    </p>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {watchlistWithPrices.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="glass-card p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={item.asset_logo || '/placeholder.svg'} alt={item.asset_name} className="w-8 h-8 rounded-full" />
                              <div>
                                <p className="font-semibold text-sm">{item.asset_symbol}</p>
                                <p className="text-[10px] text-muted-foreground">{item.asset_name}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={async () => {
                                await removeFromWatchlist(item.asset_id);
                                toast({ title: 'Removed from watchlist' });
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-lg font-semibold">
                                {formatPrice(item.currentPrice)}
                              </p>
                              <p className={`text-xs flex items-center gap-1 ${
                                item.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {item.priceChange24h >= 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
                              </p>
                            </div>
                          </div>

                          {item.alert_price ? (
                            <div className={`p-2 rounded-lg border ${
                              item.alert_triggered
                                ? 'bg-yellow-500/10 border-yellow-500/50'
                                : 'bg-muted/30 border-border/50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Bell className={`w-3.5 h-3.5 ${
                                    item.alert_triggered ? 'text-yellow-400' : 'text-muted-foreground'
                                  }`} />
                                  <span className="text-xs">
                                    {item.alert_type} ${item.alert_price.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {item.alert_triggered && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px] h-5">Triggered</Badge>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => clearAlert(item.asset_id)}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                                    <Bell className="w-3.5 h-3.5 mr-1" />
                                    Set Alert
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[90vw] sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="text-base">Set Alert for {item.asset_symbol}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Alert Type</Label>
                                      <Select value={alertType} onValueChange={(v) => setAlertType(v as 'above' | 'below')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="above">Price goes above</SelectItem>
                                          <SelectItem value="below">Price goes below</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">Target Price ($)</Label>
                                      <Input
                                        type="number"
                                        placeholder={item.currentPrice.toString()}
                                        value={alertPrice}
                                        onChange={(e) => setAlertPrice(e.target.value)}
                                      />
                                      <p className="text-xs text-muted-foreground">Current: ${item.currentPrice.toLocaleString()}</p>
                                    </div>
                                    <Button
                                      onClick={async () => {
                                        if (alertPrice) {
                                          await setAlert(item.asset_id, parseFloat(alertPrice), alertType);
                                          setAlertPrice('');
                                          toast({ title: 'Alert set!' });
                                        }
                                      }}
                                      className="w-full button-gradient"
                                      disabled={!alertPrice}
                                    >
                                      Set Alert
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1 h-8 text-xs gap-1"
                                onClick={() => generateAiForAsset(item.asset_id, item.asset_symbol, item.currentPrice)}
                                disabled={aiGeneratingFor === item.asset_id}
                              >
                                {aiGeneratingFor === item.asset_id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                AI Alerts
                              </Button>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== AI ALERTS TAB ===== */}
              <TabsContent value="ai" className="mt-4">
                <SmartAlertSuggestions
                  watchlist={watchlist.map(w => ({
                    asset_id: w.asset_id,
                    asset_symbol: w.asset_symbol,
                    asset_name: w.asset_name,
                    asset_logo: w.asset_logo,
                  }))}
                  currentPrices={currentPrices}
                  onApplyAlert={async (assetId, price, type) => {
                    await setAlert(assetId, price, type);
                  }}
                />
              </TabsContent>

              {/* ===== CONDITIONAL ALERTS TAB ===== */}
              <TabsContent value="conditional" className="mt-4">
                <ConditionalAlertBuilder />
              </TabsContent>

              {/* ===== HISTORY TAB ===== */}
              <TabsContent value="history" className="mt-4 space-y-4">
                {/* Analytics Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                        <p className="text-lg font-bold">{historyStats.total}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Unread</p>
                        <p className="text-lg font-bold">{historyStats.unread}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center">
                        <Star className="w-4 h-4 text-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Top Asset</p>
                        <p className="text-lg font-bold">{historyStats.topAsset}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Last</p>
                        <p className="text-sm font-bold truncate">{historyStats.lastTriggered}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={historyAssetFilter} onValueChange={setHistoryAssetFilter}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue placeholder="Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      {historyAssets.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  {historyStats.unread > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={async () => {
                        await markAllAlertsRead();
                        toast({ title: 'All alerts marked as read' });
                      }}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark All Read
                    </Button>
                  )}
                </div>

                {/* Table */}
                {filteredHistory.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Bell className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {alertHistory.length === 0 ? 'No alerts triggered yet' : 'No alerts match filters'}
                    </p>
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead className="text-xs">Asset</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs text-right">Target</TableHead>
                          <TableHead className="text-xs text-right">Triggered</TableHead>
                          <TableHead className="text-xs text-right hidden sm:table-cell">Diff</TableHead>
                          <TableHead className="text-xs text-right hidden sm:table-cell">Time</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((alert) => {
                          const diff = ((alert.triggered_price - alert.target_price) / alert.target_price) * 100;
                          return (
                            <TableRow
                              key={alert.id}
                              className={!alert.is_read ? 'bg-primary/5' : ''}
                            >
                              <TableCell className="p-2 text-center">
                                {!alert.is_read && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                                )}
                              </TableCell>
                              <TableCell className="p-2 font-semibold text-xs">{alert.asset_symbol}</TableCell>
                              <TableCell className="p-2">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] h-5 ${
                                    alert.alert_type === 'above'
                                      ? 'border-green-500/50 text-green-400'
                                      : 'border-red-500/50 text-red-400'
                                  }`}
                                >
                                  {alert.alert_type === 'above' ? (
                                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                  ) : (
                                    <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                                  )}
                                  {alert.alert_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-2 text-right font-mono text-xs">
                                ${alert.target_price.toLocaleString()}
                              </TableCell>
                              <TableCell className="p-2 text-right font-mono text-xs">
                                ${alert.triggered_price.toLocaleString()}
                              </TableCell>
                              <TableCell className={`p-2 text-right font-mono text-xs hidden sm:table-cell ${
                                diff >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {diff >= 0 ? '+' : ''}{diff.toFixed(2)}%
                              </TableCell>
                              <TableCell className="p-2 text-right text-[10px] text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                                {formatRelativeTime(alert.triggered_at)}
                              </TableCell>
                              <TableCell className="p-2">
                                {!alert.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => markAlertRead(alert.id)}
                                    title="Mark as read"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>

              {/* ===== ADD ASSETS TAB ===== */}
              <TabsContent value="add" className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={addAssetSearch}
                    onChange={(e) => setAddAssetSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {assets
                    .filter(asset => !watchlist.some(w => w.asset_id === asset.id))
                    .filter(asset => {
                      if (!addAssetSearch.trim()) return true;
                      const q = addAssetSearch.toLowerCase();
                      return asset.symbol.toLowerCase().includes(q) || asset.name.toLowerCase().includes(q);
                    })
                    .map((asset, i) => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="glass-card p-3">
                          <div className="flex flex-col items-center text-center gap-2">
                            <img src={asset.logo} alt={asset.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="font-semibold text-sm">{asset.symbol}</p>
                              <p className="text-[10px] text-muted-foreground truncate w-full">{asset.name}</p>
                            </div>
                            <p className="font-mono text-sm">{formatPrice(asset.price)}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-7 text-xs"
                              onClick={() => handleAddToWatchlist(asset.id)}
                            >
                              <Star className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {/* AI Single-Asset Suggestions Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={(open) => {
        setAiDialogOpen(open);
        if (!open) setAiAssetSuggestions(null);
      }}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Alert Suggestions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {aiGeneratingFor ? (
              <div className="py-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing support & resistance levels...</p>
              </div>
            ) : aiAssetSuggestions && aiAssetSuggestions.suggestions.length > 0 ? (
              <div className="space-y-2">
                {aiAssetSuggestions.suggestions.map((s, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-5 ${
                              s.type === 'above'
                                ? 'border-green-500/40 text-green-400'
                                : 'border-red-500/40 text-red-400'
                            }`}
                          >
                            {s.type === 'above' ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                            {s.type}
                          </Badge>
                          <span className="font-mono text-sm font-semibold">${s.price?.toLocaleString()}</span>
                          {s.confidence > 0 && (
                            <span className="text-[10px] text-muted-foreground">{s.confidence}% conf.</span>
                          )}
                        </div>
                        {s.reasoning && (
                          <p className="text-[11px] text-muted-foreground leading-tight">{s.reasoning}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => applyAiSuggestion(aiAssetSuggestions.asset_id, s.price, s.type as 'above' | 'below', idx)}
                        disabled={applyingAiIdx === idx}
                      >
                        {applyingAiIdx === idx ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Bell className="w-3 h-3 mr-1" />
                            Apply
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : !aiGeneratingFor ? (
              <div className="py-6 text-center text-muted-foreground">
                <p className="text-sm">No suggestions generated.</p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
}
