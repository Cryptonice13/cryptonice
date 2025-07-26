import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Menu,
  X,
  Home as HomeIcon, 
  CreditCard, 
  History,
  BookOpen,
  Shield,
  User,
  LogOut,
  Plus,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  ChevronRight,
  Calendar
} from 'lucide-react';

interface Profile {
  name: string;
  email: string;
  avatar_url?: string;
}

const Home = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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
    { name: 'Dashboard', icon: HomeIcon },
    { name: 'My Loans', icon: CreditCard },
    { name: 'Loan History', icon: History },
    { name: 'Knowledge Center', icon: BookOpen },
  ];

  const loanData = {
    totalBorrowed: 42850.75,
    currency: 'USD',
    btcEquivalent: 0.8542
  };

  const overviewCards = [
    { 
      title: 'Active Loans', 
      value: '3', 
      subtitle: 'View details', 
      color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
    },
    { 
      title: 'Next Repayment Due', 
      value: '$2,150', 
      subtitle: 'Due: Jan 15, 2024', 
      color: 'bg-orange-500/20 border-orange-500/30 text-orange-400' 
    },
    { 
      title: 'Collateral Provided', 
      value: '$65,280', 
      subtitle: 'BTC + ETH locked', 
      color: 'bg-green-500/20 border-green-500/30 text-green-400' 
    },
    { 
      title: 'Credit Limit / LTV', 
      value: '68%', 
      subtitle: '$28,150 available', 
      color: 'bg-purple-500/20 border-purple-500/30 text-purple-400' 
    },
  ];

  const loanActivity = [
    { id: 'LN001', date: '2024-01-10', amount: '$15,000', status: 'Active', repayment: '2024-02-10', asset: 'BTC' },
    { id: 'LN002', date: '2024-01-05', amount: '$8,500', status: 'Active', repayment: '2024-01-25', asset: 'ETH' },
    { id: 'LN003', date: '2023-12-20', amount: '$12,000', status: 'Paid', repayment: '2024-01-20', asset: 'BTC' },
    { id: 'LN004', date: '2023-12-15', amount: '$5,200', status: 'Overdue', repayment: '2024-01-15', asset: 'USDT' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-400 bg-green-500/20';
      case 'Paid': return 'text-blue-400 bg-blue-500/20';
      case 'Overdue': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getCryptoIcon = (asset: string) => {
    const iconMap: { [key: string]: string } = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'USDT': '$'
    };
    return iconMap[asset] || '◈';
  };

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
        <div className="text-xl font-bold text-primary">Cryptonice</div>
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="text-xl font-bold text-primary">Cryptonice</div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.name}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-accent transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {profile?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {profile?.email || user?.email}
                </div>
              </div>
            </div>
          </div>
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
                    Welcome back, {profile?.name || user?.email?.split('@')[0] || 'User'} 👋
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your crypto loans and track your borrowing journey
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" size="sm">
                    <History className="w-4 h-4 mr-2" />
                    View Loan History
                  </Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Apply for Loan
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
                        ${loanData.totalBorrowed.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">
                        ≈ {loanData.btcEquivalent} BTC
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-2">Last updated</div>
                      <div className="text-sm">5 mins ago</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {overviewCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
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
                  </motion.div>
                ))}
              </div>

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
                        {loanActivity.map((loan) => (
                          <tr key={loan.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
    </div>
  );
};

export default Home;