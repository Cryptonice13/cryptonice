import { useState } from 'react';
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
import { formatCurrency, formatPercentage } from '@/lib/format';

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [sortBy, setSortBy] = useState('apy');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState('');

  // Mock data for lending pools
  const lendingPools = [
    {
      asset: 'USDC',
      supplyAPY: 3.2,
      borrowAPY: 5.8,
      availableLiquidity: 1200000,
      totalSupplied: 5000000,
      icon: '💰',
      collateralRatio: 80,
      liquidationThreshold: 85
    },
    {
      asset: 'ETH',
      supplyAPY: 2.5,
      borrowAPY: 4.9,
      availableLiquidity: 800,
      totalSupplied: 4500,
      icon: '⟠',
      collateralRatio: 75,
      liquidationThreshold: 80
    },
    {
      asset: 'DAI',
      supplyAPY: 4.1,
      borrowAPY: 6.5,
      availableLiquidity: 950000,
      totalSupplied: 3200000,
      icon: '◈',
      collateralRatio: 80,
      liquidationThreshold: 85
    },
    {
      asset: 'WBTC',
      supplyAPY: 1.8,
      borrowAPY: 3.2,
      availableLiquidity: 50,
      totalSupplied: 200,
      icon: '₿',
      collateralRatio: 70,
      liquidationThreshold: 75
    }
  ];

  // Mock data for loan marketplace (peer-to-peer)
  const loanRequests = [
    {
      borrower: '0x123...abc',
      loanAmount: '$2,000 DAI',
      collateral: '1.5 ETH',
      duration: '6 months',
      rate: '7%',
      status: 'Open',
      healthFactor: 1.8
    },
    {
      borrower: '0x456...def',
      loanAmount: '$5,000 USDC',
      collateral: '2.8 ETH',
      duration: '3 months',
      rate: '6.5%',
      status: 'Funding',
      healthFactor: 2.1
    },
    {
      borrower: '0x789...ghi',
      loanAmount: '$1,500 DAI',
      collateral: '0.8 WBTC',
      duration: '12 months',
      rate: '8%',
      status: 'Open',
      healthFactor: 1.6
    }
  ];

  // Mock stats
  const stats = {
    totalValueLocked: 12500000,
    activeUsers: 1247,
    loansFunded: 892,
    avgSupplyAPY: 2.9,
    avgBorrowAPY: 5.1
  };

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
          </div>
          <h1 className="text-4xl font-bold gradient-text">
            Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse lending pools, supply liquidity, or apply for loans directly.
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mt-6">
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
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="DAI">DAI</SelectItem>
                <SelectItem value="WBTC">WBTC</SelectItem>
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
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{pool.icon}</span>
                              <span className="font-medium">{pool.asset}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-green-500 font-medium">
                            {formatPercentage(pool.supplyAPY)}
                          </TableCell>
                          <TableCell className="text-orange-500 font-medium">
                            {formatPercentage(pool.borrowAPY)}
                          </TableCell>
                          <TableCell>
                            {pool.asset === 'ETH' || pool.asset === 'WBTC' 
                              ? `${pool.availableLiquidity.toLocaleString()} ${pool.asset}`
                              : formatCurrency(pool.availableLiquidity)
                            }
                          </TableCell>
                          <TableCell>
                            {pool.asset === 'ETH' || pool.asset === 'WBTC'
                              ? `${pool.totalSupplied.toLocaleString()} ${pool.asset}`
                              : formatCurrency(pool.totalSupplied)
                            }
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
                      {loanRequests.map((loan, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            {loan.borrower}
                          </TableCell>
                          <TableCell className="font-medium">
                            {loan.loanAmount}
                          </TableCell>
                          <TableCell>{loan.collateral}</TableCell>
                          <TableCell>{loan.duration}</TableCell>
                          <TableCell className="text-orange-500 font-medium">
                            {loan.rate}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={loan.status === 'Open' ? 'default' : 'secondary'}
                              className="bg-green-500/10 text-green-500"
                            >
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm"
                              className="bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              Fund Loan
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
    </div>
  );
};

export default Marketplace;