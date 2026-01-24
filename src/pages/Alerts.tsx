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
  Menu,
  X,
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
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function Alerts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addAlertDialogOpen, setAddAlertDialogOpen] = useState(false);
  const [selectedAssetForAlert, setSelectedAssetForAlert] = useState('');
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

  const handleSetAlert = () => {
    if (selectedAssetForAlert && alertPrice) {
      setAlert(selectedAssetForAlert, parseFloat(alertPrice), alertType);
      toast({
        title: 'Alert Set',
        description: `Alert will trigger when price goes ${alertType} $${alertPrice}`,
      });
      setAddAlertDialogOpen(false);
      setSelectedAssetForAlert('');
      setAlertPrice('');
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
            <Link to="/markets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Markets</Link>
            <Link to="/alerts" className="text-sm font-medium text-primary">Alerts</Link>
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
              <Link to="/markets" className="block py-2 text-muted-foreground">Markets</Link>
              <Link to="/alerts" className="block py-2 text-primary font-medium">Alerts</Link>
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
              <h1 className="text-3xl font-bold">Alerts & Watchlist</h1>
              <p className="text-muted-foreground">Track your favorite assets and set price alerts</p>
            </div>
          </div>

          {/* Triggered Alerts Banner */}
          {triggeredAlerts.length > 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="font-semibold text-yellow-400">
                    {triggeredAlerts.length} Alert{triggeredAlerts.length > 1 ? 's' : ''} Triggered!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {triggeredAlerts.map(a => a.symbol).join(', ')} reached target price
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Tabs defaultValue="watchlist" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="watchlist">
                <Star className="w-4 h-4 mr-2" />
                Watchlist ({watchlist.length})
              </TabsTrigger>
              <TabsTrigger value="add">
                <Plus className="w-4 h-4 mr-2" />
                Add Assets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="watchlist" className="mt-6">
              {watchlist.length === 0 ? (
                <Card className="glass-card p-8 text-center">
                  <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your Watchlist is Empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Add assets to your watchlist to track prices and set alerts.
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchlistWithPrices.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="glass-card p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={item.logo} alt={item.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="font-semibold">{item.symbol}</p>
                              <p className="text-xs text-muted-foreground">{item.name}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              removeFromWatchlist(item.id);
                              toast({ title: 'Removed from watchlist' });
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-xl font-semibold">
                              ${item.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className={`text-sm flex items-center gap-1 ${
                              item.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {item.priceChange24h >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
                            </p>
                          </div>
                        </div>

                        {/* Alert Section */}
                        {item.alertPrice ? (
                          <div className={`p-3 rounded-lg border ${
                            triggeredAlerts.some(a => a.id === item.id)
                              ? 'bg-yellow-500/10 border-yellow-500/50'
                              : 'bg-muted/30 border-border/50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bell className={`w-4 h-4 ${
                                  triggeredAlerts.some(a => a.id === item.id)
                                    ? 'text-yellow-400'
                                    : 'text-muted-foreground'
                                }`} />
                                <span className="text-sm">
                                  Alert: {item.alertType} ${item.alertPrice.toLocaleString()}
                                </span>
                              </div>
                              {triggeredAlerts.some(a => a.id === item.id) && (
                                <Badge className="bg-yellow-500/20 text-yellow-400">Triggered!</Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                <Bell className="w-4 h-4 mr-2" />
                                Set Alert
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Set Price Alert for {item.symbol}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                  <Label>Alert Type</Label>
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
                                  <Label>Target Price ($)</Label>
                                  <Input
                                    type="number"
                                    placeholder={item.currentPrice.toString()}
                                    value={alertPrice}
                                    onChange={(e) => setAlertPrice(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Current price: ${item.currentPrice.toLocaleString()}
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

            <TabsContent value="add" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets
                  .filter(asset => !watchlist.some(w => w.id === asset.id))
                  .map((asset, i) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="glass-card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={asset.logo} alt={asset.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="font-semibold">{asset.symbol}</p>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono">${asset.price.toLocaleString()}</p>
                            <p className={`text-xs ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddToWatchlist(asset.id)}
                          className="w-full mt-4"
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Watchlist
                        </Button>
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
