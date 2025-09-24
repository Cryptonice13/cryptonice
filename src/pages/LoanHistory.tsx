import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  History, 
  ExternalLink, 
  Download, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface LoanHistoryItem {
  id: string;
  date: string;
  action: string;
  loan_id: string;
  amount: string;
  tx_hash?: string;
  status: string;
  block_explorer_url?: string;
}

const LoanHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<LoanHistoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<LoanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data for demonstration - Crypto lending transactions
  const mockHistoryData: LoanHistoryItem[] = [
    {
      id: '1',
      date: '2024-01-15',
      action: 'Deposit',
      loan_id: 'ETH-001',
      amount: '2.5 ETH',
      status: 'Completed',
      tx_hash: '0x1a2b3c4d5e6f789012345678901234567890abcd'
    },
    {
      id: '2', 
      date: '2024-01-16',
      action: 'Borrow',
      loan_id: 'USDC-002',
      amount: '3,200 USDC',
      status: 'Completed',
      tx_hash: '0x2b3c4d5e6f7890123456789012345678901abcde'
    },
    {
      id: '3',
      date: '2024-01-17',
      action: 'Repay',
      loan_id: 'USDC-002',
      amount: '800 USDC',
      status: 'Completed',
      tx_hash: '0x3c4d5e6f78901234567890123456789012abcdef'
    },
    {
      id: '4',
      date: '2024-01-20',
      action: 'Withdraw',
      loan_id: 'ETH-001',
      amount: '0.5 ETH',
      status: 'Completed',
      tx_hash: '0x4d5e6f7890123456789012345678901234abcdef0'
    },
    {
      id: '5',
      date: '2024-01-22',
      action: 'Deposit',
      loan_id: 'WBTC-003',
      amount: '0.1 WBTC',
      status: 'Completed',
      tx_hash: '0x5e6f78901234567890123456789012345abcdef01'
    },
    {
      id: '6',
      date: '2024-01-23',
      action: 'Borrow',
      loan_id: 'DAI-004',
      amount: '1,500 DAI',
      status: 'Failed',
      tx_hash: '0x6f7890123456789012345678901234abcdef0123'
    },
    {
      id: '7',
      date: '2024-01-25',
      action: 'Liquidation',
      loan_id: 'ETH-001',
      amount: '0.3 ETH',
      status: 'Executed',
      tx_hash: '0x7890123456789012345678901234abcdef012345'
    }
  ];

  useEffect(() => {
    fetchLoanHistory();
  }, [user]);

  useEffect(() => {
    filterData();
  }, [historyData, searchTerm, statusFilter]);

  const fetchLoanHistory = async () => {
    setLoading(true);
    try {
      // For now, using mock data. In production, this would fetch from Supabase
      // and potentially combine with on-chain transaction data
      
      // const { data, error } = await supabase
      //   .from('loan_history')
      //   .select('*')
      //   .eq('user_id', user?.id)
      //   .order('created_at', { ascending: false });

      // if (error) throw error;
      
      setHistoryData(mockHistoryData);
    } catch (error) {
      console.error('Error fetching loan history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch loan history",
        variant: "destructive"
      });
      setHistoryData(mockHistoryData); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = historyData;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.loan_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.amount.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredData(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/20';
      case 'executed':
        return 'text-orange-400 bg-orange-500/20';
      case 'cancelled':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'deposit':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'withdraw':
        return <TrendingDown className="w-4 h-4 text-blue-400" />;
      case 'borrow':
        return <TrendingDown className="w-4 h-4 text-orange-400" />;
      case 'repay':
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      case 'liquidation':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleViewOnExplorer = (txHash: string) => {
    // For Ethereum mainnet - adjust URL based on your network
    const explorerUrl = `https://etherscan.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  const handleExportHistory = () => {
    const csvContent = [
      ['Date', 'Action', 'Loan ID', 'Amount', 'Status', 'Tx Hash'],
      ...filteredData.map(item => [
        item.date,
        item.action,
        item.loan_id,
        item.amount,
        item.status,
        item.tx_hash || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loan-history.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Loan history exported successfully"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-accent rounded w-1/4"></div>
            <div className="h-32 bg-accent rounded"></div>
            <div className="h-64 bg-accent rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/my-loans')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Loans
            </Button>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
                <History className="w-8 h-8 text-primary" />
                Transaction History
              </h1>
              <p className="text-muted-foreground">
                Track all your DeFi lending and borrowing activities
              </p>
            </div>
          </div>
          <Button onClick={handleExportHistory} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Deposits</div>
              <div className="text-2xl font-bold text-green-400">
                {historyData.filter(item => item.action === 'Deposit').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Borrows</div>
              <div className="text-2xl font-bold text-orange-400">
                {historyData.filter(item => item.action === 'Borrow').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Repays</div>
              <div className="text-2xl font-bold text-purple-400">
                {historyData.filter(item => item.action === 'Repay').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Completed Txs</div>
              <div className="text-2xl font-bold text-blue-400">
                {historyData.filter(item => item.status === 'Completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by token, action, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="executed">Executed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Action</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Asset</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Tx Hash</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                        <td className="py-4 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {item.date}
                        </td>
                        <td className="py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {getActionIcon(item.action)}
                            {item.action}
                          </div>
                        </td>
                        <td className="py-4 font-mono text-sm">{item.loan_id}</td>
                        <td className="py-4 font-semibold">{item.amount}</td>
                        <td className="py-4">
                          <Badge className={`${getStatusColor(item.status)} border-0`}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-4 font-mono text-sm">
                          {item.tx_hash ? (
                            <span className="text-blue-400">
                              {`${item.tx_hash.slice(0, 6)}...${item.tx_hash.slice(-4)}`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-4">
                          {item.tx_hash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOnExplorer(item.tx_hash!)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoanHistory;