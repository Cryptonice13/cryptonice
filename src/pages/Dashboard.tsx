import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  Bot,
  Wallet,
  TrendingUp,
  PieChart,
  Bell,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  LineChart,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { useMarketData } from '@/hooks/useMarketData';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { assets } = useMarketData();

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

  const quickActions = [
    { title: 'Portfolio', desc: 'Track your holdings', icon: PieChart, href: '/portfolio', color: 'from-blue-500 to-cyan-500' },
    { title: 'Markets', desc: 'Explore crypto markets', icon: BarChart3, href: '/markets', color: 'from-green-500 to-emerald-500' },
    { title: 'Signals', desc: 'AI trading signals', icon: TrendingUp, href: '/markets', color: 'from-purple-500 to-pink-500' },
    { title: 'Alerts', desc: 'Price alerts & watchlist', icon: Bell, href: '/alerts', color: 'from-orange-500 to-red-500' },
  ];

  const topMovers = assets.slice(0, 4).sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h));

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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-primary">Dashboard</Link>
            <Link to="/portfolio" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
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

            {/* Mobile Menu Toggle */}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50"
          >
            <nav className="container mx-auto px-4 py-4 space-y-2">
              <Link to="/dashboard" className="block py-2 text-primary font-medium">Dashboard</Link>
              <Link to="/portfolio" className="block py-2 text-muted-foreground">Portfolio</Link>
              <Link to="/markets" className="block py-2 text-muted-foreground">Markets</Link>
              <Link to="/alerts" className="block py-2 text-muted-foreground">Alerts</Link>
              {isConnected && (
                <>
                  <Link to="/profile" className="block py-2 text-muted-foreground">Profile</Link>
                  <Link to="/settings" className="block py-2 text-muted-foreground">Settings</Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-24 md:pb-8">
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - AI Chat */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h1 className="text-3xl font-bold">
                Welcome{isConnected ? `, ${formatAddress(address!)}` : ''}
              </h1>
              <p className="text-muted-foreground">
                Your AI-powered crypto advisor is ready to help you make smarter decisions.
              </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {quickActions.map((action, i) => (
                <Link key={i} to={action.href}>
                  <Card className="glass-card p-4 hover:scale-105 transition-transform cursor-pointer group">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
                  </Card>
                </Link>
              ))}
            </motion.div>

            {/* AI Chat Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="h-[500px]"
            >
              <ChatInterface />
            </motion.div>
          </div>

          {/* Right Column - Market Overview */}
          <div className="space-y-6">
            {/* AI Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Features</h3>
                    <p className="text-xs text-muted-foreground">Powered by advanced AI</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <PieChart className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium">Portfolio Analysis</p>
                      <p className="text-xs text-muted-foreground">AI-powered insights</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <LineChart className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium">Market Predictions</p>
                      <p className="text-xs text-muted-foreground">Data-driven forecasts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium">Trading Signals</p>
                      <p className="text-xs text-muted-foreground">Buy/sell recommendations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium">Risk Assessment</p>
                      <p className="text-xs text-muted-foreground">Portfolio protection</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Top Movers */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Top Movers</h3>
                  <Link to="/markets" className="text-xs text-primary hover:underline">View All</Link>
                </div>
                <div className="space-y-3">
                  {topMovers.map((asset, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={asset.logo} alt={asset.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-medium text-sm">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">${asset.price.toLocaleString()}</p>
                        <p className={`text-xs ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Connect Wallet CTA */}
            {!isConnected && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="glass-card p-6 text-center space-y-4 gradient-border">
                  <Wallet className="w-12 h-12 mx-auto text-primary" />
                  <div>
                    <h3 className="font-semibold">Connect Wallet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect your wallet to get personalized AI analysis of your portfolio.
                    </p>
                  </div>
                  <Button onClick={handleConnect} className="w-full button-gradient">
                    Connect Wallet
                  </Button>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
