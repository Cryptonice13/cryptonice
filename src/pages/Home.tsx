import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home as HomeIcon, 
  CreditCard, 
  ShoppingCart, 
  TrendingUp, 
  User, 
  LogOut,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface Profile {
  name: string;
  email: string;
  avatar_url?: string;
}

const Home = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');

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
    { name: 'Loans', icon: CreditCard },
    { name: 'Marketplace', icon: ShoppingCart },
    { name: 'Impact', icon: TrendingUp },
  ];

  const creditData = {
    score: 742,
    change: '+15',
    status: 'Excellent'
  };

  const statsData = [
    { label: 'Total Borrowed', value: '$12,450', change: '+5.2%', positive: true },
    { label: 'Total Lent', value: '$8,320', change: '+12.8%', positive: true },
    { label: 'Active Loans', value: '3', change: '-1', positive: false },
    { label: 'Credit Utilization', value: '23%', change: '-3%', positive: true },
  ];

  const paymentHistory = [
    { name: 'Alice Johnson', date: '2024-01-15', amount: '$500', status: 'completed' },
    { name: 'Bob Smith', date: '2024-01-12', amount: '$750', status: 'completed' },
    { name: 'Carol Davis', date: '2024-01-10', amount: '$300', status: 'pending' },
    { name: 'David Wilson', date: '2024-01-08', amount: '$1,200', status: 'failed' },
    { name: 'Eva Brown', date: '2024-01-05', amount: '$450', status: 'completed' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-20 bg-gray-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-8">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-green-400 rounded-xl flex items-center justify-center mb-8">
          <span className="text-black font-bold text-xl">P</span>
        </div>

        <nav className="space-y-6 mb-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                activeTab === item.name
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={item.name}
            >
              <item.icon className="w-6 h-6" />
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Profile" 
              className="w-12 h-12 rounded-full border-2 border-primary/30"
            />
          ) : (
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
              <User className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {profile?.name || user?.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-gray-400">
                Here's a look at your performance and analytics.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
              >
                <Calendar className="w-4 h-4 mr-2" />
                January 2024 - May 2024
              </Button>
              <Button 
                className="bg-primary text-black hover:bg-primary/90"
              >
                Add new coin
              </Button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Stats and Chart */}
            <div className="col-span-8 space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-gray-900/50 border-white/10 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-400 mb-1">SPENT THIS MONTH</div>
                    <div className="text-3xl font-bold text-white mb-2">$5,950.64</div>
                    <div className="flex items-center text-sm">
                      <div className="text-gray-400 mr-2">241% CHANGE</div>
                      <div className="text-green-400">+ 2.34%</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-white/10 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-400 mb-1">VOLUME (24H)</div>
                    <div className="text-3xl font-bold text-white">$84.42B</div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-white/10 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-400 mb-1">MARKET CAP</div>
                    <div className="text-3xl font-bold text-white">$804.42B</div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-white/10 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-400 mb-1">AVG MONTHLY GROWTH</div>
                    <div className="text-3xl font-bold text-white">$804.42B</div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart Area */}
              <Card className="bg-gray-900/50 border-white/10 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Active credit</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    Download Report
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80 relative">
                    {/* Mock Chart Background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent rounded-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white rounded-lg px-4 py-2 text-black text-sm font-medium">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-xs text-gray-600">BTC</div>
                            <div className="font-bold">$8,420.04</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">ETH</div>
                            <div className="font-bold">$2,980.81</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Mock chart line */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
                      <path
                        d="M20 160 L60 140 L100 120 L140 100 L180 80 L220 70 L260 65 L300 60 L340 55 L380 50"
                        stroke="rgb(0, 255, 157)"
                        strokeWidth="3"
                        fill="none"
                        className="drop-shadow-lg"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Credit Score and Crypto */}
            <div className="col-span-4 space-y-6">
              {/* Credit Score */}
              <Card className="bg-gray-900/50 border-white/10 rounded-2xl">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-400 mb-4">Your credit score</div>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgb(0, 255, 157)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="200, 251"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm text-primary mb-1">80%</div>
                        <div className="text-3xl font-bold text-white">660</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-400 mb-2">
                    Last Check on 21 Apr
                  </div>
                  <div className="text-center text-sm text-green-400">
                    + 2.34%
                  </div>
                  <div className="text-center text-sm text-gray-400 mt-2">
                    Your credit score is average
                  </div>
                </CardContent>
              </Card>

              {/* Bitcoin Card */}
              <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/20 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">₿</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Bitcoin</div>
                        <div className="text-gray-400 text-sm">BTC</div>
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm">Reward Rate</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">$52,291</div>
                  <div className="text-green-400 text-sm">+0.74%</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="bg-gray-900/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-gray-400 font-medium">NAME</th>
                        <th className="text-left py-3 text-gray-400 font-medium">DATE</th>
                        <th className="text-left py-3 text-gray-400 font-medium">PRICE</th>
                        <th className="text-left py-3 text-gray-400 font-medium">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">A</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">Achain</div>
                              <div className="text-red-400 text-sm">-8.43%</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-400">12 Jun, 2024</td>
                        <td className="py-4 text-white font-medium">$ 14.92.33</td>
                        <td className="py-4">
                          <span className="text-green-400 text-sm">● Successful</span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">C</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">Cardano</div>
                              <div className="text-green-400 text-sm">+ 2.34%</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-400">16 May, 2024</td>
                        <td className="py-4 text-white font-medium">$ 2.4309.00</td>
                        <td className="py-4">
                          <span className="text-green-400 text-sm">● Successful</span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">D</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">Digibyte</div>
                              <div className="text-gray-400 text-sm">+16.84</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-400">21 Feb, 2024</td>
                        <td className="py-4 text-white font-medium">$ 3.00</td>
                        <td className="py-4">
                          <span className="text-green-400 text-sm">● Successful</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">E</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">Ethereum</div>
                              <div className="text-red-400 text-sm">-34.34%</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-400">19 Dec, 2023</td>
                        <td className="py-4 text-white font-medium">$ 3.00</td>
                        <td className="py-4">
                          <span className="text-green-400 text-sm">● Successful</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;