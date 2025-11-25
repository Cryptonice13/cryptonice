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
import MobileBottomNav from '@/components/MobileBottomNav';
import { Menu, X, Home as HomeIcon, ShoppingBag, Image as ImageIcon, User, Settings, Wallet, Copy, ExternalLink, TrendingUp, Sparkles, Plus, Eye, Heart, Share2 } from 'lucide-react';

interface Profile {
  name: string;
  email: string;
  avatar_url?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const menuItems = [
    { name: 'Home', icon: HomeIcon, href: '/home' },
    { name: 'NFT Marketplace', icon: ShoppingBag, href: '/nft-marketplace' },
    { name: 'My Collection', icon: ImageIcon, href: '/nft-marketplace' }
  ];

  // Mock trending NFTs data
  const trendingNFTs = [
    {
      id: 1,
      name: 'Digital Dreams #1234',
      collection: 'Digital Dreams',
      image: '/lovable-uploads/86329743-ee49-4f2e-96f7-50508436273d.png',
      price: '2.5 ETH',
      likes: 142
    },
    {
      id: 2,
      name: 'Cyber Punk #5678',
      collection: 'Cyber Punks',
      image: '/lovable-uploads/7335619d-58a9-41ad-a233-f7826f56f3e9.png',
      price: '1.8 ETH',
      likes: 98
    },
    {
      id: 3,
      name: 'Abstract Art #9012',
      collection: 'Abstract Collection',
      image: '/lovable-uploads/b6436838-5c1a-419a-9cdc-1f9867df073d.png',
      price: '3.2 ETH',
      likes: 256
    },
    {
      id: 4,
      name: 'Neon Nights #3456',
      collection: 'Neon Series',
      image: '/lovable-uploads/79f2b901-8a4e-42a5-939f-fae0828e0aef.png',
      price: '1.5 ETH',
      likes: 187
    }
  ];

  // Mock top collections
  const topCollections = [
    { name: 'Digital Dreams', volume: '1,234 ETH', change: '+12.5%', floor: '2.1 ETH' },
    { name: 'Cyber Punks', volume: '987 ETH', change: '+8.3%', floor: '1.5 ETH' },
    { name: 'Abstract Collection', volume: '756 ETH', change: '+15.7%', floor: '2.8 ETH' }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-accent"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="text-xl font-bold text-primary">NFT Marketplace</div>
        <div className="flex items-center gap-2">
          {isConnected && address ? (
            <div
              className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(address);
                toast({
                  title: "Copied",
                  description: "Address copied to clipboard"
                });
              }}
            >
              <Wallet className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-mono">
                {`${address.slice(0, 4)}...${address.slice(-4)}`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 rounded-lg">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">No wallet</span>
            </div>
          )}
          <div
            className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-primary">NFT Marketplace</div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-lg hover:bg-accent"
              >
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

            {/* Authentication Buttons */}
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
            {menuItems.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-accent transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {user && (
            <div className="absolute bottom-4 left-4 right-4 space-y-2">
              <Link
                to="/settings"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span>Settings</span>
              </Link>
              <Link
                to="/profile"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {profile?.name || user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    {profile?.email || user?.email}
                    {isConnected && (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs px-1 py-0">
                        Web3
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-8"
            >
              {/* Main Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    Discover NFTs 🎨
                  </h1>
                  <p className="text-muted-foreground">
                    Explore, collect, and trade unique digital products on the blockchain
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate('/nft-marketplace')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Explore Marketplace
                  </Button>
                  <Button
                    onClick={() => navigate('/nft-marketplace')}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create NFT
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <div className="text-sm text-muted-foreground">Total Volume</div>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">2,847 ETH</div>
                    <div className="text-sm text-green-400 mt-1">+12.5% this week</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <ImageIcon className="w-5 h-5 text-blue-400" />
                      <div className="text-sm text-muted-foreground">NFTs Listed</div>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">12,459</div>
                    <div className="text-sm text-green-400 mt-1">+234 today</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-green-400" />
                      <div className="text-sm text-muted-foreground">Active Users</div>
                    </div>
                    <div className="text-3xl font-bold text-green-400">8,943</div>
                    <div className="text-sm text-green-400 mt-1">+5.2% this week</div>
                  </CardContent>
                </Card>
              </div>

              {/* Trending NFTs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Trending NFTs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {trendingNFTs.map((nft) => (
                      <motion.div
                        key={nft.id}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => navigate('/nft-marketplace')}
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border">
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground mb-1">
                              {nft.collection}
                            </div>
                            <div className="font-medium mb-2 truncate">{nft.name}</div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-bold text-primary">
                                {nft.price}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Heart className="w-3 h-3" />
                                {nft.likes}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Collections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Top Collections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCollections.map((collection, index) => (
                      <div
                        key={collection.name}
                        className="flex items-center justify-between p-4 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors cursor-pointer"
                        onClick={() => navigate('/nft-marketplace')}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{collection.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Floor: {collection.floor}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{collection.volume}</div>
                          <div className="text-sm text-green-400">{collection.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-8 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">Start Your NFT Journey</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Connect your wallet to start buying, selling, and creating unique digital products on our platform.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => navigate('/nft-marketplace')}
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Browse Marketplace
                    </Button>
                    <Button
                      onClick={() => navigate('/nft-marketplace')}
                      size="lg"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First NFT
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Home;
