import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import MobileBottomNav from '@/components/MobileBottomNav';
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  Zap, 
  ArrowRight, 
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Users,
  BarChart3,
  Layers,
  Send,
  ExternalLink,
  Star,
  Menu,
  X
} from 'lucide-react';

// Mock market data
const marketData = [
  { asset: 'ETH', icon: '⟠', supplyAPY: 12.5, borrowAPY: 8.2, totalSupply: '$850M', totalBorrow: '$420M', utilization: 49 },
  { asset: 'USDC', icon: '◎', supplyAPY: 8.8, borrowAPY: 5.5, totalSupply: '$1.2B', totalBorrow: '$680M', utilization: 57 },
  { asset: 'USDT', icon: '₮', supplyAPY: 9.2, borrowAPY: 6.1, totalSupply: '$780M', totalBorrow: '$390M', utilization: 50 },
  { asset: 'DAI', icon: '◈', supplyAPY: 7.5, borrowAPY: 4.8, totalSupply: '$320M', totalBorrow: '$180M', utilization: 56 },
  { asset: 'WBTC', icon: '₿', supplyAPY: 5.2, borrowAPY: 3.1, totalSupply: '$450M', totalBorrow: '$125M', utilization: 28 },
];

const testimonials = [
  { name: 'Alex Chen', role: 'DeFi Trader', text: 'Best yields I\'ve found in the market. The platform is incredibly intuitive.', avatar: 'AC' },
  { name: 'Sarah Kim', role: 'Crypto Investor', text: 'Trustworthy and secure. I\'ve been earning passive income for over 2 years.', avatar: 'SK' },
  { name: 'Marcus Johnson', role: 'Fund Manager', text: 'The multi-chain support and competitive rates make this my go-to platform.', avatar: 'MJ' },
  { name: 'Elena Rodriguez', role: 'Yield Farmer', text: 'Flash loans have revolutionized my arbitrage strategies. Incredible tool.', avatar: 'ER' },
];

const chains = [
  { name: 'Ethereum', icon: '⟠' },
  { name: 'Polygon', icon: '⬡' },
  { name: 'Arbitrum', icon: '◆' },
  { name: 'Optimism', icon: '⬢' },
  { name: 'Base', icon: '◉' },
  { name: 'Avalanche', icon: '△' },
];

const Home = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatedTVL, setAnimatedTVL] = useState(0);
  const [animatedUsers, setAnimatedUsers] = useState(0);

  // Animate counters
  useEffect(() => {
    const tvlInterval = setInterval(() => {
      setAnimatedTVL(prev => {
        if (prev >= 2.5) {
          clearInterval(tvlInterval);
          return 2.5;
        }
        return prev + 0.05;
      });
    }, 30);

    const usersInterval = setInterval(() => {
      setAnimatedUsers(prev => {
        if (prev >= 125000) {
          clearInterval(usersInterval);
          return 125000;
        }
        return prev + 2500;
      });
    }, 30);

    return () => {
      clearInterval(tvlInterval);
      clearInterval(usersInterval);
    };
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({ title: 'Copied', description: 'Address copied to clipboard' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="grid-pattern absolute inset-0 opacity-30" />
        {/* Blockchain animation dots */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Layers className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">DeFiLend</span>
            </div>
            <nav className="hidden lg:flex items-center gap-6">
              <button onClick={() => navigate('/markets')} className="text-foreground/80 hover:text-primary transition-colors font-medium">Markets</button>
              <button onClick={() => navigate('/aave-dashboard')} className="text-foreground/80 hover:text-primary transition-colors font-medium">Dashboard</button>
              <button className="text-foreground/80 hover:text-primary transition-colors font-medium">Governance</button>
              <button className="text-foreground/80 hover:text-primary transition-colors font-medium">Docs</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            {isConnected && address ? (
              <div className="hidden sm:flex items-center gap-3">
                <div 
                  className="glass px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer hover:bg-white/10"
                  onClick={copyAddress}
                >
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-mono text-foreground">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => disconnect()}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleConnect}
                disabled={isPending}
                className="button-gradient text-primary-foreground font-semibold px-6"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
            
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden glass border-t border-border/50 p-4"
          >
            <nav className="flex flex-col gap-2">
              <button onClick={() => { navigate('/markets'); setMobileMenuOpen(false); }} className="text-left py-3 px-4 rounded-lg hover:bg-white/10 text-foreground/80">Markets</button>
              <button onClick={() => { navigate('/aave-dashboard'); setMobileMenuOpen(false); }} className="text-left py-3 px-4 rounded-lg hover:bg-white/10 text-foreground/80">Dashboard</button>
              <button className="text-left py-3 px-4 rounded-lg hover:bg-white/10 text-foreground/80">Governance</button>
              <button className="text-left py-3 px-4 rounded-lg hover:bg-white/10 text-foreground/80">Docs</button>
              {isConnected && address && (
                <div className="pt-2 border-t border-border/50 mt-2">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm font-mono text-muted-foreground">{address.slice(0, 6)}...{address.slice(-4)}</span>
                    <Button variant="ghost" size="sm" onClick={() => disconnect()} className="text-destructive">
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </header>

      <main className="pt-24 relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-8 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Hero Content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 lg:space-y-8"
            >
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-foreground/80">Live APY Rates</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
                <span className="text-foreground">Earn </span>
                <span className="text-gradient">8-20% APY</span>
                <br />
                <span className="text-foreground">Lend & Borrow Crypto</span>
              </h1>
              
              <p className="text-base lg:text-lg text-muted-foreground max-w-lg">
                Access the most competitive rates in DeFi. Supply assets to earn yield or borrow against your collateral with instant liquidity.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/aave-dashboard')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Lend Now
                </Button>
                <Button 
                  onClick={() => navigate('/aave-dashboard')}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Borrow Now
                </Button>
              </div>

              {/* Dashboard Teaser */}
              {isConnected && (
                <Card className="glass p-4 border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Portfolio</p>
                      <p className="text-2xl font-bold text-foreground">$0.00</p>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/aave-dashboard')} className="text-primary">
                      View Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              )}
            </motion.div>

            {/* Right: Live Markets Table */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-4 lg:p-6 border border-border/50"
            >
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="text-lg font-semibold text-foreground">Live Markets</h3>
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <div className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                  Real-time
                </Badge>
              </div>
              
              <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="text-muted-foreground text-sm border-b border-border/50">
                      <th className="text-left py-3 font-medium">Asset</th>
                      <th className="text-right py-3 font-medium">Supply APY</th>
                      <th className="text-right py-3 font-medium">Borrow APY</th>
                      <th className="text-right py-3 font-medium hidden sm:table-cell">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map((market) => (
                      <tr 
                        key={market.asset} 
                        className="border-b border-border/30 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => navigate('/aave-dashboard')}
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{market.icon}</span>
                            <span className="font-medium text-foreground">{market.asset}</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <span className="text-primary font-semibold">{market.supplyAPY}%</span>
                        </td>
                        <td className="text-right">
                          <span className="text-accent font-semibold">{market.borrowAPY}%</span>
                        </td>
                        <td className="text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                style={{ width: `${market.utilization}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{market.utilization}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-primary hover:bg-primary/10"
                onClick={() => navigate('/markets')}
              >
                View All Markets <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 lg:mb-12 text-foreground">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Lend Now Card */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="glass p-6 border-border/50 hover:border-primary/50 transition-all group cursor-pointer h-full" onClick={() => navigate('/aave-dashboard')}>
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Lend Assets</h3>
                <p className="text-muted-foreground mb-4 text-sm">Supply crypto and earn competitive APY on your idle assets.</p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  Lend Now
                </Button>
              </Card>
            </motion.div>

            {/* Borrow Now Card */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="glass p-6 border-border/50 hover:border-accent/50 transition-all group cursor-pointer h-full" onClick={() => navigate('/aave-dashboard')}>
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/30 transition-colors">
                  <Wallet className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Borrow Crypto</h3>
                <p className="text-muted-foreground mb-4 text-sm">Borrow against your collateral with instant liquidity access.</p>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  Borrow Now
                </Button>
              </Card>
            </motion.div>

            {/* Flash Loans Card */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="glass p-6 border-border/50 hover:border-yellow-500/50 transition-all group cursor-pointer h-full">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-4 group-hover:bg-yellow-500/30 transition-colors">
                  <Zap className="w-7 h-7 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Flash Loans</h3>
                <p className="text-muted-foreground mb-4 text-sm">Instant uncollateralized loans for arbitrage and liquidations.</p>
                <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                  Learn More
                </Button>
              </Card>
            </motion.div>

            {/* Stake Card */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="glass p-6 border-border/50 hover:border-purple-500/50 transition-all group cursor-pointer h-full">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <Layers className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Stake & Earn</h3>
                <p className="text-muted-foreground mb-4 text-sm">Stake governance tokens for additional rewards and voting power.</p>
                <Button variant="outline" className="w-full border-purple-500/50 text-purple-500 hover:bg-purple-500/10">
                  Start Staking
                </Button>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl lg:text-4xl font-bold mb-4 text-foreground">Built for Security & Performance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade infrastructure with audited smart contracts and multi-chain support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Security Badges */}
            <Card className="glass p-6 lg:p-8 border-border/50">
              <Shield className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Bank-Grade Security</h3>
              <p className="text-muted-foreground mb-6">
                Our smart contracts are audited by leading security firms with over $2.5B secured.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-secondary/50 text-foreground">Certik Audited</Badge>
                <Badge variant="secondary" className="bg-secondary/50 text-foreground">Trail of Bits</Badge>
                <Badge variant="secondary" className="bg-secondary/50 text-foreground">OpenZeppelin</Badge>
              </div>
            </Card>

            {/* Multi-Chain */}
            <Card className="glass p-6 lg:p-8 border-border/50">
              <Globe className="w-12 h-12 text-accent mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Multi-Chain Support</h3>
              <p className="text-muted-foreground mb-6">
                Deploy and manage your positions across 6+ blockchain networks seamlessly.
              </p>
              <div className="flex flex-wrap gap-2">
                {chains.map((chain) => (
                  <div 
                    key={chain.name}
                    className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full"
                  >
                    <span className="text-base">{chain.icon}</span>
                    <span className="text-xs text-foreground">{chain.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Governance */}
            <Card className="glass p-6 lg:p-8 border-border/50 md:col-span-2 lg:col-span-1">
              <Users className="w-12 h-12 text-purple-500 mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Community Governed</h3>
              <p className="text-muted-foreground mb-6">
                Token holders control protocol parameters, upgrades, and treasury allocation.
              </p>
              <Button variant="outline" className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10">
                View Proposals <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </div>
        </section>

        {/* Stats & Testimonials Section */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Stats */}
            <div className="space-y-6 lg:space-y-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Trusted by Thousands</h2>
              
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                <Card className="glass p-4 lg:p-6 border-border/50 text-center">
                  <BarChart3 className="w-6 lg:w-8 h-6 lg:h-8 text-primary mx-auto mb-2 lg:mb-3" />
                  <p className="text-2xl lg:text-3xl font-bold text-gradient">${animatedTVL.toFixed(1)}B</p>
                  <p className="text-muted-foreground text-xs lg:text-sm">Total Value Locked</p>
                </Card>
                <Card className="glass p-4 lg:p-6 border-border/50 text-center">
                  <Users className="w-6 lg:w-8 h-6 lg:h-8 text-accent mx-auto mb-2 lg:mb-3" />
                  <p className="text-2xl lg:text-3xl font-bold text-gradient">{animatedUsers.toLocaleString()}+</p>
                  <p className="text-muted-foreground text-xs lg:text-sm">Active Users</p>
                </Card>
                <Card className="glass p-4 lg:p-6 border-border/50 text-center">
                  <Zap className="w-6 lg:w-8 h-6 lg:h-8 text-yellow-500 mx-auto mb-2 lg:mb-3" />
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">$15B+</p>
                  <p className="text-muted-foreground text-xs lg:text-sm">Flash Loan Volume</p>
                </Card>
                <Card className="glass p-4 lg:p-6 border-border/50 text-center">
                  <Lock className="w-6 lg:w-8 h-6 lg:h-8 text-purple-500 mx-auto mb-2 lg:mb-3" />
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">0</p>
                  <p className="text-muted-foreground text-xs lg:text-sm">Security Incidents</p>
                </Card>
              </div>
            </div>

            {/* Testimonials Carousel */}
            <div className="glass rounded-2xl p-6 lg:p-8 border border-border/50">
              <div className="flex items-center gap-1 mb-4 lg:mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 lg:w-5 h-4 lg:h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              
              <div className="min-h-[100px] lg:min-h-[120px] mb-4 lg:mb-6">
                <p className="text-base lg:text-lg text-foreground italic mb-4">
                  "{testimonials[testimonialIndex].text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {testimonials[testimonialIndex].avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonials[testimonialIndex].name}</p>
                    <p className="text-sm text-muted-foreground">{testimonials[testimonialIndex].role}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTestimonialIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === testimonialIndex ? 'bg-primary' : 'bg-secondary'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <button 
                    onClick={() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length)}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter & Final CTA */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <Card className="glass p-6 lg:p-12 border-border/50 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 lg:w-64 h-48 lg:h-64 bg-primary/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 lg:w-64 h-48 lg:h-64 bg-accent/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-2xl lg:text-4xl font-bold mb-4 text-foreground">
                Start Earning Today
              </h2>
              <p className="text-muted-foreground mb-6 lg:mb-8 text-base lg:text-lg">
                Join thousands of users earning passive income on their crypto assets.
              </p>

              {/* Newsletter */}
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 max-w-md mx-auto mb-6 lg:mb-8">
                <Input
                  type="email"
                  placeholder="Enter your email for updates"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground"
                />
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 shrink-0">
                  <Send className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>

              {/* Final CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/aave-dashboard')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 lg:px-10 py-5 lg:py-6 text-base lg:text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Lend Now
                </Button>
                <Button 
                  onClick={() => navigate('/aave-dashboard')}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 lg:px-10 py-5 lg:py-6 text-base lg:text-lg rounded-xl shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Borrow Now
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 lg:py-12 mt-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">DeFiLend</span>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Docs</a>
                <a href="#" className="hover:text-primary transition-colors">Support</a>
              </div>
              <p className="text-sm text-muted-foreground">© 2024 DeFiLend. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
};

export default Home;
