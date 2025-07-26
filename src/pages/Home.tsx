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
      <div className="w-64 bg-gray-900/50 backdrop-blur-xl border-r border-white/10 p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold">Cryptonice</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.name
                  ? 'bg-primary text-black font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl mb-4">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-black" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {profile?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {profile?.email || user?.email}
              </p>
            </div>
          </div>
          
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {profile?.name || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-gray-400">
              Here's your lending dashboard overview
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">{stat.label}</span>
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className={`text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Credit Score & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Credit Score Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Credit Score</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center">
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
                          strokeDasharray={`${(creditData.score / 850) * 251}, 251`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {creditData.score}
                          </div>
                          <div className="text-xs text-gray-400">
                            {creditData.change}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-green-400 font-medium">
                      {creditData.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Credit Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Active Credit Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-48 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Credit activity chart coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Payment History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-gray-400 font-medium">Name</th>
                        <th className="text-left py-3 text-gray-400 font-medium">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Date
                        </th>
                        <th className="text-left py-3 text-gray-400 font-medium">Amount</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 text-white">{payment.name}</td>
                          <td className="py-4 text-gray-400">{payment.date}</td>
                          <td className="py-4 text-white font-medium">{payment.amount}</td>
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(payment.status)}
                              <span className={`capitalize ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
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