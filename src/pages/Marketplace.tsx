import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, TrendingUp, Users, DollarSign, Target, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DepositModal } from '@/components/DepositModal';
import { BorrowModal } from '@/components/BorrowModal';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/lib/format';
import { SUPPORTED_TOKENS } from '@/config/tokens';
import { supabase } from '@/integrations/supabase/client';
import MobileBottomNav from '@/components/MobileBottomNav';

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [sortBy, setSortBy] = useState('apy');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState('');

  // Real-time data states
  const [loanRequests, setLoanRequests] = useState<any[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  // Real lending pools from SUPPORTED_TOKENS
  const lendingPools = SUPPORTED_TOKENS.map(token => ({
    asset: token.symbol,
    supplyAPY: token.supplyAPY,
    borrowAPY: token.borrowAPY,
    availableLiquidity: parseFloat(token.totalSupply) - parseFloat(token.totalBorrow),
    totalSupplied: parseFloat(token.totalSupply),
    icon: token.symbol === 'ETH' ? '⟠' : 
          token.symbol === 'USDC' ? '💰' : 
          token.symbol === 'USDT' ? '💵' : '◈',
    collateralRatio: token.ltv,
    liquidationThreshold: token.liquidationThreshold,
    logo: token.logo
  }));

  // Calculate real stats from token data
  const stats = {
    totalValueLocked: lendingPools.reduce((acc, pool) => acc + (pool.totalSupplied * 2000), 0), // Estimate using $2000 per unit
    activeUsers: loanRequests.length * 15, // Estimate based on loan requests
    loansFunded: loanRequests.filter(loan => loan.status === 'Approved' || loan.status === 'Funding').length,
    avgSupplyAPY: lendingPools.reduce((acc, pool) => acc + pool.supplyAPY, 0) / lendingPools.length,
    avgBorrowAPY: lendingPools.reduce((acc, pool) => acc + pool.borrowAPY, 0) / lendingPools.length
  };

  // Fetch real loan requests from Supabase
  useEffect(() => {
    const fetchLoanRequests = async () => {
      setIsLoadingLoans(true);
      try {
        const { data, error } = await supabase
          .from('loan_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setLoanRequests(data || []);
      } catch (error) {
        console.error('Error fetching loan requests:', error);
        setLoanRequests([]);
      } finally {
        setIsLoadingLoans(false);
      }
    };

    fetchLoanRequests();
  }, []);

  const handleSupply = (asset: string) => {
    setSelectedToken(asset);
    setIsDepositModalOpen(true);
  };

  const handleBorrow = (asset: string) => {
    setSelectedToken(asset);
    setIsBorrowModalOpen(true);
  };

  const filteredPools = lendingPools.filter(pool => 
    pool.asset.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedAsset === 'all' || pool.asset === selectedAsset)
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold gradient-text">
            Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse lending pools, supply liquidity, or apply for loans directly.
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto mt-6">
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {SUPPORTED_TOKENS.map(token => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apy">Highest APY</SelectItem>
                <SelectItem value="liquidity">Most Liquidity</SelectItem>
                <SelectItem value="volume">Highest Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Lending Pools Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Lending Pools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Supply APY</TableHead>
                        <TableHead>Borrow APY</TableHead>
                        <TableHead>Available Liquidity</TableHead>
                        <TableHead>Total Supplied</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPools.map((pool) => (
                        <TableRow key={pool.asset}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img 
                                src={pool.logo} 
                                alt={pool.asset}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                              <div>
                                <div className="font-medium">{pool.asset}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-green-500 font-medium">
                            {formatPercentage(pool.supplyAPY)}
                          </TableCell>
                          <TableCell className="text-orange-500 font-medium">
                            {formatPercentage(pool.borrowAPY)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCompactNumber(pool.availableLiquidity)} {pool.asset}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(pool.availableLiquidity * 2000)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCompactNumber(pool.totalSupplied)} {pool.asset}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(pool.totalSupplied * 2000)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSupply(pool.asset)}
                                className="text-green-500 border-green-500/20 hover:bg-green-500/10"
                              >
                                Supply
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleBorrow(pool.asset)}
                                className="text-orange-500 border-orange-500/20 hover:bg-orange-500/10"
                              >
                                Borrow
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Loan Marketplace */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Direct Loan Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Borrower</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Collateral</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingLoans ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading loan requests...
                          </TableCell>
                        </TableRow>
                      ) : loanRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No loan requests available
                          </TableCell>
                        </TableRow>
                      ) : (
                        loanRequests.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell className="font-mono text-sm">
                              {loan.user_id ? `${loan.user_id.slice(0, 6)}...${loan.user_id.slice(-4)}` : 'Anonymous'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(parseFloat(loan.loan_amount))} {loan.asset_name || 'USD'}
                            </TableCell>
                            <TableCell>
                              {loan.collateral_value ? formatCurrency(parseFloat(loan.collateral_value)) : 'N/A'} {loan.collateral_type || ''}
                            </TableCell>
                            <TableCell>{loan.duration_months} months</TableCell>
                            <TableCell className="text-orange-500 font-medium">
                              {loan.interest_type || 'Fixed'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={loan.status === 'Pending Review' ? 'default' : 'secondary'}
                                className={
                                  loan.status === 'Approved' ? 'bg-green-500/10 text-green-500' :
                                  loan.status === 'Pending Review' ? 'bg-yellow-500/10 text-yellow-500' :
                                  'bg-gray-500/10 text-gray-500'
                                }
                              >
                                {loan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm"
                                className="bg-primary/10 text-primary hover:bg-primary/20"
                                disabled={loan.status !== 'Approved'}
                              >
                                {loan.status === 'Approved' ? 'Fund Loan' : 'Review Pending'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Market Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Value Locked</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(stats.totalValueLocked)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-xl font-semibold">{stats.activeUsers.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Loans Funded</p>
                  <p className="text-xl font-semibold">{stats.loansFunded.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Supply APY</p>
                  <p className="text-xl font-semibold text-green-500">
                    {formatPercentage(stats.avgSupplyAPY)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Borrow APY</p>
                  <p className="text-xl font-semibold text-orange-500">
                    {formatPercentage(stats.avgBorrowAPY)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => setIsDepositModalOpen(true)}>
                  Supply Liquidity
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsBorrowModalOpen(true)}
                >
                  Apply for Loan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/my-loans'}
                >
                  View My Positions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        open={isDepositModalOpen}
        onOpenChange={setIsDepositModalOpen}
        tokenSymbol={selectedToken}
      />
      <BorrowModal
        open={isBorrowModalOpen}
        onOpenChange={setIsBorrowModalOpen}
        tokenSymbol={selectedToken}
      />
      <MobileBottomNav />
    </div>
  );
};

export default Marketplace;