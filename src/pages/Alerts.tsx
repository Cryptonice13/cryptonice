import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  Bot,
  Wallet,
  Bell,
  Star,
  Settings,
  User,
  LogOut,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
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
import { useMarketData, useWatchlist } from '@/hooks/useMarketData';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function Alerts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');

  const { assets } = useMarketData();
  const { watchlist, addToWatchlist, removeFromWatchlist, setAlert } = useWatchlist();

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

  const handleAddToWatchlist = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      addToWatchlist(asset);
      toast({ title: 'Added to watchlist', description: `${asset.symbol} added to your watchlist.` });
    }
  };

  // Watchlist items with current prices
  const watchlistWithPrices = watchlist.map(item => {
    const currentAsset = assets.find(a => a.id === item.id);
    return {
      ...item,
      currentPrice: currentAsset?.price || item.price,
      priceChange24h: currentAsset?.priceChange24h || item.priceChange24h,
    };
  });

  // Check for triggered alerts
  const triggeredAlerts = watchlistWithPrices.filter(item => {
    if (!item.alertPrice || !item.alertType) return false;
    if (item.alertType === 'above' && item.currentPrice >= item.alertPrice) return true;
    if (item.alertType === 'below' && item.currentPrice <= item.alertPrice) return true;
    return false;
  });

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
            <Link to="/markets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Markets</Link>
            <Link to="/alerts" className="text-sm font-medium text-primary">Alerts</Link>
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
                    {triggeredAlerts.map(a => a.symbol).join(', ')}
                  </p>
                </div>
              </div>
            </Card>
          )}

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
                            <img src={item.logo} alt={item.name} className="w-8 h-8 rounded-full" />
                            <div>
                              <p className="font-semibold text-sm">{item.symbol}</p>
                              <p className="text-[10px] text-muted-foreground">{item.name}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              removeFromWatchlist(item.id);
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
                        {item.alertPrice ? (
                          <div className={`p-2 rounded-lg border ${
                            triggeredAlerts.some(a => a.id === item.id)
                              ? 'bg-yellow-500/10 border-yellow-500/50'
                              : 'bg-muted/30 border-border/50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Bell className={`w-3.5 h-3.5 ${
                                  triggeredAlerts.some(a => a.id === item.id)
                                    ? 'text-yellow-400'
                                    : 'text-muted-foreground'
                                }`} />
                                <span className="text-xs">
                                  {item.alertType} ${item.alertPrice.toLocaleString()}
                                </span>
                              </div>
                              {triggeredAlerts.some(a => a.id === item.id) && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px] h-5">Triggered</Badge>
                              )}
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
                                <DialogTitle className="text-base">Set Alert for {item.symbol}</DialogTitle>
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
                                  onClick={() => {
                                    if (alertPrice) {
                                      setAlert(item.id, parseFloat(alertPrice), alertType);
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
                  .filter(asset => !watchlist.some(w => w.id === asset.id))
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
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
