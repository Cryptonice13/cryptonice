import { useState, useEffect } from 'react';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import { useWatchlistDb } from '@/hooks/useWatchlistDb';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNav from '@/components/MobileBottomNav';
import AppHeader from '@/components/AppHeader';

export default function Alerts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [historySheetOpen, setHistorySheetOpen] = useState(false);

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

  // Build current prices map and check alerts
  const currentPrices = new Map(assets.map(a => [a.id, a.price]));
  
  // Check alerts when prices update
  useEffect(() => {
    if (watchlist.length > 0 && assets.length > 0) {
      checkAlerts(currentPrices);
    }
  }, [assets]);

  // Watchlist items with current prices
  const watchlistWithPrices = watchlist.map(item => {
    const currentAsset = assets.find(a => a.id === item.asset_id);
    return {
      ...item,
      currentPrice: currentAsset?.price || 0,
      priceChange24h: currentAsset?.priceChange24h || 0,
    };
  });

  // Get triggered alerts (those that are marked as triggered)
  const triggeredAlerts = watchlistWithPrices.filter(item => item.alert_triggered);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="alerts" />

      {/* Main Content */}
      <main className="px-3 sm:px-4 pt-14 pb-20 lg:pb-8">
        <div className="mt-4 space-y-4">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Alerts & Watchlist</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Track favorites and set price alerts</p>
            </div>
            <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 relative">
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">History</span>
                  {unreadAlertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadAlertCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90%] max-w-md">
                <SheetHeader>
                  <SheetTitle>Alert History</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  {alertHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No alerts triggered yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alertHistory.map((alert) => (
                        <Card 
                          key={alert.id} 
                          className={`p-3 cursor-pointer transition-colors ${!alert.is_read ? 'bg-primary/5 border-primary/30' : ''}`}
                          onClick={() => markAlertRead(alert.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-yellow-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm flex items-center gap-1.5">
                                  {alert.asset_symbol}
                                  {!alert.is_read && (
                                    <span className="w-2 h-2 bg-primary rounded-full" />
                                  )}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {alert.alert_type} ${alert.target_price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm">${alert.triggered_price.toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(alert.triggered_at).toLocaleDateString()}
                              </p>
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="watchlist" className="text-xs sm:text-sm">
                  <Star className="w-3.5 h-3.5 mr-1.5" />
                  Watchlist ({watchlist.length})
                </TabsTrigger>
                <TabsTrigger value="add" className="text-xs sm:text-sm">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Assets
                </TabsTrigger>
              </TabsList>

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
                                ${item.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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

                          {/* Alert Section */}
                          {item.alert_price ? (
                            <div className={`p-2 rounded-lg border ${
                              item.alert_triggered
                                ? 'bg-yellow-500/10 border-yellow-500/50'
                                : 'bg-muted/30 border-border/50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Bell className={`w-3.5 h-3.5 ${
                                    item.alert_triggered
                                      ? 'text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`} />
                                  <span className="text-xs">
                                    {item.alert_type} ${item.alert_price.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {item.alert_triggered && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px] h-5">Triggered</Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => clearAlert(item.asset_id)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                                  <Bell className="w-3.5 h-3.5 mr-1.5" />
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
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
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
                                    <p className="text-xs text-muted-foreground">
                                      Current: ${item.currentPrice.toLocaleString()}
                                    </p>
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
                          )}
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {assets
                    .filter(asset => !watchlist.some(w => w.asset_id === asset.id))
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
                            <p className="font-mono text-sm">${asset.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
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

      <MobileBottomNav />
    </div>
  );
}
