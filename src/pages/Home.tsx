import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLendingStore } from '@/state/lendingStore';
import { useLendingPool } from '@/hooks/useLendingPool';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { Menu, X, Home as HomeIcon, CreditCard, History, BookOpen, Shield, User, LogOut, Plus, Clock, TrendingUp, AlertTriangle, Info, ChevronRight, Calendar, Settings, Wallet, Copy, ExternalLink } from 'lucide-react';
interface Profile {
  name: string;
  email: string;
  avatar_url?: string;
}
const Home = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    address,
    isConnected
  } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    toast
  } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false);
  
  // Real-time lending data
  const { 
    totalCollateral, 
    totalDebt, 
    healthFactor, 
    availableBorrows, 
    liquidationThreshold,
    ltv,
    userPositions,
    isLoading: lendingLoading 
  } = useLendingStore();
  
  const { getUserAccountData, deposit } = useLendingPool();
  const { balances, isLoading: balancesLoading } = useTokenBalances();
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Fetch real-time lending data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      getUserAccountData().then((data) => {
        if (data) {
          // Update the lending store with the account data
          // For now we'll just log it since we're using mock data
          console.log('Account data:', data);
        }
      }).catch(console.error);
    }
  }, [isConnected, address, getUserAccountData]);

  useEffect(() => {
    if (connectError) {
      toast({
        title: "Connection Error",
        description: connectError.message,
        variant: "destructive"
      });
    }
  }, [connectError, toast]);
  const fetchProfile = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('user_id', user?.id).single();
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const menuItems = [{
    name: 'Dashboard',
    icon: HomeIcon,
    href: '/home'
  }, {
    name: 'My Loans',
    icon: CreditCard,
    href: '/my-loans'
  }, {
    name: 'Marketplace',
    icon: BookOpen,
    href: '/marketplace'
  }, {
    name: 'Impact',
    icon: TrendingUp,
    href: '/impact'
  }];
  // Real-time calculated values
  const loanData = {
    totalBorrowed: parseFloat(totalDebt),
    currency: 'USD',
    btcEquivalent: parseFloat(totalDebt) / 65000 // Approximate BTC price
  };
  
  const overviewCards = [{
    title: 'Collateral Value',
    value: isConnected ? `$${parseFloat(totalCollateral).toLocaleString()}` : '$0',
    subtitle: userPositions.length > 0 ? `${userPositions.length} assets locked` : 'No collateral',
    color: 'bg-green-500/20 border-green-500/30 text-green-400'
  }, {
    title: 'Health Factor',
    value: isConnected ? parseFloat(healthFactor).toFixed(2) : '0.00',
    subtitle: `LTV: ${isConnected ? parseFloat(ltv).toFixed(1) : '0.0'}%`,
    color: parseFloat(healthFactor) > 1.5 ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
  }];
  // Real-time loan activity from user positions
  const loanActivity = userPositions
    .filter(position => parseFloat(position.borrowed) > 0)
    .map((position, index) => ({
      id: `LN${String(index + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0], // Current date as placeholder
      amount: `$${parseFloat(position.borrowed).toLocaleString()}`,
      status: 'Active',
      repayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      asset: position.token.symbol
    }));
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-400 bg-green-500/20';
      case 'Paid':
        return 'text-blue-400 bg-blue-500/20';
      case 'Overdue':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };
  const getCryptoIcon = (asset: string) => {
    const iconMap: {
      [key: string]: string;
    } = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'USDT': '$'
    };
    return iconMap[asset] || '◈';
  };
  return <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-accent">
          <Menu className="w-6 h-6" />
        </button>
        <div className="text-xl font-bold text-primary">Cryptonice</div>
        <div className="flex items-center gap-2">
          {/* Wallet indicator */}
          {isConnected && address ? <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg cursor-pointer" onClick={() => {
          navigator.clipboard.writeText(address);
          toast({
            title: "Copied",
            description: "Address copied to clipboard"
          });
        }}>
              <Wallet className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-mono">
                {`${address.slice(0, 4)}...${address.slice(-4)}`}
              </span>
            </div> : <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 rounded-lg">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">No wallet</span>
            </div>}
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer" onClick={() => navigate('/profile')}>
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-primary">Cryptonice</div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Wallet Connect Button */}
            <Popover open={walletPopoverOpen} onOpenChange={setWalletPopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  className={`w-full justify-start font-bold ${
                    isConnected && address 
                      ? 'bg-green-500 hover:bg-green-400 text-black' 
                      : 'bg-green-500 hover:bg-green-400 text-black'
                  }`}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnected && address 
                    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
                    : 'Connect Wallet'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" side="right" align="start">
                <div className="p-4">
                  {isConnected && address ? (
                    // Connected state
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-green-400">Wallet Connected</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Address:</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className="bg-green-500/10 text-green-400 border-green-500/20 cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(address);
                              toast({
                                title: "Copied",
                                description: "Address copied to clipboard"
                              });
                            }}
                          >
                            {`${address.slice(0, 6)}...${address.slice(-4)}`}
                          </Badge>
                          <a
                            href={`https://etherscan.io/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          disconnect();
                          setWalletPopoverOpen(false);
                        }}
                        variant="outline"
                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                      >
                        Disconnect Wallet
                      </Button>
                    </div>
                  ) : (
                    // Disconnected state
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        <span className="font-medium">Connect Your Wallet</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred wallet to connect
                      </p>
                      <div className="space-y-2">
                        {connectors.map((connector) => (
                          <Button
                            key={connector.uid}
                            onClick={() => {
                              connect({ connector });
                              setWalletPopoverOpen(false);
                            }}
                            disabled={isPending}
                            variant="outline"
                            className="w-full justify-start h-12 hover:bg-accent"
                          >
                            <Wallet className="w-5 h-5 mr-3" />
                            {connector.name}
                            {isPending && (
                              <div className="ml-auto w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Authentication Buttons - Show only when not authenticated */}
            {!user && (
              <div className="space-y-3 mt-4">
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full justify-start bg-[#222] border border-gray-600 text-white hover:border-green-400"
                  variant="outline"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full justify-start bg-[#222] border border-gray-600 text-white hover:border-green-400"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map(item => <Link key={item.name} to={item.href} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-accent transition-colors" onClick={() => setSidebarOpen(false)}>
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span>{item.name}</span>
              </Link>)}
            
          </nav>

          {user && (
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <Link to="/settings" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors" onClick={() => setSidebarOpen(false)}>
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span>Settings</span>
            </Link>
            <Link to="/profile" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors" onClick={() => setSidebarOpen(false)}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {profile?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  {profile?.email || user?.email}
                  {isConnected && <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs px-1 py-0">
                      Web3
                    </Badge>}
                </div>
              </div>
            </Link>
          </div>
          )}
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-8">
            <motion.div initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} className="max-w-7xl mx-auto space-y-8">

              {/* Main Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    Welcome back, {profile?.name || user?.email?.split('@')[0] || 'User'} 👋
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your crypto loans and track your borrowing journey
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  
                  <Button onClick={() => navigate('/apply-loan')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Let Borrow
                  </Button>
                </div>
              </div>

              {/* Total Borrowed Section */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Total Borrowed</div>
                      <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                        {isConnected ? `$${loanData.totalBorrowed.toLocaleString()}` : '$0.00'}
                      </div>
                      <div className="text-muted-foreground">
                        ≈ {isConnected ? loanData.btcEquivalent.toFixed(4) : '0.0000'} BTC
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-2">Available to borrow</div>
                      <div className="text-sm font-semibold">
                        {isConnected ? `$${parseFloat(availableBorrows).toLocaleString()}` : '$0.00'}
                      </div>
                      {lendingLoading && (
                        <div className="text-xs text-muted-foreground mt-1">Updating...</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Collateral Section */}
              {isConnected && balances.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Available Collateral
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {balancesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      balances.map((tokenBalance) => (
                        <div key={tokenBalance.symbol} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-accent/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {tokenBalance.symbol === 'ETH' ? 'Ξ' : tokenBalance.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{tokenBalance.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {tokenBalance.balance}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={async () => {
                              try {
                                if (tokenBalance.address) {
                                  await deposit(tokenBalance.address, tokenBalance.balance);
                                } else {
                                  // For ETH, use zero address
                                  await deposit('0x0000000000000000000000000000000000000000', tokenBalance.balance);
                                }
                              } catch (error) {
                                console.error('Deposit failed:', error);
                              }
                            }}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            Use as Collateral
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overviewCards.map((card, index) => <motion.div key={card.title} initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: index * 0.1
              }}>
                    <Card className={`${card.color} border cursor-pointer hover:scale-105 transition-transform`}>
                      <CardContent className="p-6">
                        <div className="text-sm font-medium mb-2">{card.title}</div>
                        <div className="text-2xl font-bold mb-1">{card.value}</div>
                        <div className="text-sm opacity-80 flex items-center gap-1">
                          {card.subtitle}
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>)}
              </div>

              {/* Assets to Borrow Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Assets to Borrow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userPositions.length > 0 ? (
                      // Show user's actual positions
                      userPositions.map((position) => (
                        <Card key={position.token.symbol} className="hover:bg-accent/50 cursor-pointer transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl text-primary">{getCryptoIcon(position.token.symbol)}</span>
                                <div>
                                  <div className="font-medium">{position.token.name}</div>
                                  <div className="text-sm text-muted-foreground">{position.token.symbol}</div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Deposited</span>
                                <span className="font-medium">{parseFloat(position.supplied).toFixed(6)} {position.token.symbol}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Borrowed</span>
                                <span className="font-medium text-orange-400">{parseFloat(position.borrowed).toFixed(6)} {position.token.symbol}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-3">
                              Manage {position.token.symbol}
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      // Show available assets when no positions
                      [
                        { name: 'Bitcoin', symbol: 'BTC', icon: '₿', apy: '8.5%', maxLtv: '70%', color: 'text-orange-400' },
                        { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', apy: '7.2%', maxLtv: '75%', color: 'text-blue-400' },
                        { name: 'USDT', symbol: 'USDT', icon: '$', apy: '6.8%', maxLtv: '80%', color: 'text-green-400' }
                      ].map((asset) => (
                        <Card key={asset.symbol} className="hover:bg-accent/50 cursor-pointer transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className={`text-2xl ${asset.color}`}>{asset.icon}</span>
                                <div>
                                  <div className="font-medium">{asset.name}</div>
                                  <div className="text-sm text-muted-foreground">{asset.symbol}</div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">APY</span>
                                <span className="font-medium text-green-400">{asset.apy}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Max LTV</span>
                                <span className="font-medium">{asset.maxLtv}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-3">
                              Borrow {asset.symbol}
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Collateral Asset Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Collateral Asset
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userPositions.length > 0 ? (
                      // Show user's actual collateral positions
                      userPositions
                        .filter(position => parseFloat(position.supplied) > 0)
                        .map((position) => (
                          <Card key={`collateral-${position.token.symbol}`} className="hover:bg-accent/50 cursor-pointer transition-colors border-accent">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl text-primary">{getCryptoIcon(position.token.symbol)}</span>
                                  <div>
                                    <div className="font-medium">{position.token.name}</div>
                                    <div className="text-sm text-muted-foreground">{position.token.symbol}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Deposited</span>
                                  <span className="font-medium">{parseFloat(position.supplied).toFixed(6)} {position.token.symbol}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">aToken Balance</span>
                                  <span className="font-medium text-green-400">{parseFloat(position.aTokenBalance).toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Current LTV</span>
                                  <span className="font-medium">{parseFloat(ltv).toFixed(1)}%</span>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" className="w-full mt-3">
                                Manage {position.token.symbol}
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground col-span-full">
                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No Collateral Deposited</p>
                        <p className="text-sm">Connect your wallet and deposit assets to start using them as collateral.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Loan Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Loan Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {loanActivity.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 text-sm font-medium text-muted-foreground">Loan ID</th>
                            <th className="text-left py-3 text-sm font-medium text-muted-foreground">Date Borrowed</th>
                            <th className="text-left py-3 text-sm font-medium text-muted-foreground">Amount</th>
                            <th className="text-left py-3 text-sm font-medium text-muted-foreground">Asset</th>
                            <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="text-left py-3 text-sm font-medium text-muted-foreground">Repayment Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanActivity.map(loan => <tr key={loan.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                              <td className="py-4 font-mono text-sm">{loan.id}</td>
                              <td className="py-4 text-sm">{loan.date}</td>
                              <td className="py-4 font-semibold">{loan.amount}</td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getCryptoIcon(loan.asset)}</span>
                                  <span className="text-sm">{loan.asset}</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                                  {loan.status}
                                </span>
                              </td>
                              <td className="py-4 text-sm">{loan.repayment}</td>
                            </tr>)}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No Active Loans</p>
                        <p className="text-sm">Connect your wallet and start borrowing to see your loan activity here.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips & Security Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Quick Tip</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Learn how interest is calculated on crypto loans and optimize your borrowing strategy.
                        </p>
                        <Button variant="outline" size="sm">
                          Go to Knowledge Center
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Security Reminder</h3>
                        <p className="text-sm text-muted-foreground">
                          Never share your seed phrase. Cryptonice will never ask for your private keys.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="pt-8 border-t border-border">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                  <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                  <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                  <a href="#" className="hover:text-foreground transition-colors">Contact</a>
                  <a href="#" className="hover:text-foreground transition-colors">Support</a>
                  <select className="bg-transparent border-none text-muted-foreground hover:text-foreground">
                    <option>English</option>
                    <option>Español</option>
                    <option>Français</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>;
};
export default Home;