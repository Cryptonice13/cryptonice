import { useState, useEffect } from 'react';
import { useWalletStore } from '@/state/walletStore';
import { useLending } from '@/hooks/useLending';
import { useStaking } from '@/hooks/useStaking';
import { useAave } from '@/hooks/useAave';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, TrendingUp, DollarSign, Users, ArrowLeft, ExternalLink } from 'lucide-react';
import { formatUnits } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useChainId } from 'wagmi';

export default function Finance() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const chainId = useChainId();
  const { address, isConnected, connect } = useWalletStore();
  const {
    loans,
    borrowerLoans,
    lenderLoans,
    isLoading: lendingLoading,
    stats: lendingStats,
    createLoan,
    fundLoan,
    disburseLoan,
    repayLoan,
    getTokenBalance,
    mintTokens: mintLendingTokens,
  } = useLending();

  const {
    stakingInfo,
    tokenBalance: stakingTokenBalance,
    isLoading: stakingLoading,
    stake,
    unstake,
    claimReward,
    mintTokens: mintStakingTokens,
  } = useStaking();

  const {
    availableChains,
    aaveMarkets,
    selectedMarket,
    isLoading: aaveLoading,
    error: aaveError,
    fetchMarkets,
  } = useAave();

  const [loanForm, setLoanForm] = useState({
    amount: '',
    duration: '',
    interestRate: '',
    purpose: '',
  });

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [lendingTokenBalance, setLendingTokenBalance] = useState('0');

  useEffect(() => {
    if (isConnected) {
      getTokenBalance().then(setLendingTokenBalance);
    }
  }, [isConnected, getTokenBalance]);

  useEffect(() => {
    if (chainId && isConnected) {
      fetchMarkets(chainId, address);
    }
  }, [chainId, isConnected, address, fetchMarkets]);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLoan(
      loanForm.amount,
      Number(loanForm.duration) * 86400, // Convert days to seconds
      Number(loanForm.interestRate),
      loanForm.purpose
    );
    setLoanForm({ amount: '', duration: '', interestRate: '', purpose: '' });
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    await stake(stakeAmount);
    setStakeAmount('');
  };

  const handleUnstake = async (e: React.FormEvent) => {
    e.preventDefault();
    await unstake(unstakeAmount);
    setUnstakeAmount('');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to access the Finance page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={async () => {
                try {
                  await connect();
                } catch (error: any) {
                  if (!error.message.includes("Opening MetaMask")) {
                    toast({
                      title: "Connection Failed",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                }
              }} 
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Finance Hub</h1>
                <p className="text-sm text-muted-foreground">Lending & Staking Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Connected Address</p>
                <p className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">CRDX Balance</p>
                <p className="font-semibold">{parseFloat(stakingTokenBalance).toFixed(2)} CRDX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lendingStats.totalLoans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Funded</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(lendingStats.totalVolumeFunded).toFixed(2)} USDC</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(stakingInfo.totalPoolStaked).toFixed(2)} CRDX</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staking APY</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stakingInfo.apy}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="lending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lending">Lending</TabsTrigger>
            <TabsTrigger value="staking">Staking Pool</TabsTrigger>
            <TabsTrigger value="aave" onClick={() => navigate('/aave-dashboard')}>Aave Protocol</TabsTrigger>
          </TabsList>

          {/* Lending Section */}
          <TabsContent value="lending" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Borrower Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Request a Loan</CardTitle>
                  <CardDescription>
                    Fill out the form to create a loan request
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span>USDC Balance: {parseFloat(lendingTokenBalance).toFixed(2)}</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => mintLendingTokens('1000')}
                      >
                        Get Test USDC
                      </Button>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateLoan} className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Loan Amount (USDC)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="1000"
                        value={loanForm.amount}
                        onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (days)</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="30"
                        value={loanForm.duration}
                        onChange={(e) => setLoanForm({ ...loanForm, duration: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="interestRate">Interest Rate (%)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.1"
                        placeholder="5.0"
                        value={loanForm.interestRate}
                        onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="purpose">Purpose</Label>
                      <Textarea
                        id="purpose"
                        placeholder="Describe the purpose of the loan"
                        value={loanForm.purpose}
                        onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={lendingLoading}>
                      {lendingLoading ? 'Creating...' : 'Create Loan Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* My Loans */}
              <Card>
                <CardHeader>
                  <CardTitle>My Loans</CardTitle>
                  <CardDescription>Your active loans as borrower</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {borrowerLoans.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No loans yet</p>
                    ) : (
                      borrowerLoans.map((loan) => (
                        <Card key={loan.id} className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{loan.amount} USDC</p>
                                <p className="text-xs text-muted-foreground">
                                  {loan.interestRate}% interest • {Math.floor(Number(loan.duration) / 86400)} days
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                loan.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                loan.status === 'Funded' ? 'bg-blue-100 text-blue-800' :
                                loan.status === 'Repaid' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {loan.status}
                              </span>
                            </div>
                            <p className="text-xs">{loan.purpose}</p>
                            {loan.status === 'Funded' && (
                              <div className="flex gap-2 pt-2">
                                <Button size="sm" onClick={() => disburseLoan(loan.id)} disabled={lendingLoading}>
                                  Disburse
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => repayLoan(loan.id)} disabled={lendingLoading}>
                                  Repay ({loan.totalRepayment} USDC)
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Loans for Lenders */}
            <Card>
              <CardHeader>
                <CardTitle>Available Loan Requests</CardTitle>
                <CardDescription>Fund loans and earn interest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loans.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                      No pending loan requests
                    </p>
                  ) : (
                    loans.map((loan) => (
                      <Card key={loan.id} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-lg">{loan.amount} USDC</p>
                            <p className="text-xs text-muted-foreground">
                              Borrower: {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                            </p>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duration:</span>
                              <span>{Math.floor(Number(loan.duration) / 86400)} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Interest:</span>
                              <span className="text-green-600 font-semibold">{loan.interestRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Returns:</span>
                              <span className="font-semibold">{loan.totalRepayment} USDC</span>
                            </div>
                          </div>
                          <p className="text-xs border-t pt-2">{loan.purpose}</p>
                          <Button
                            className="w-full"
                            size="sm"
                            onClick={() => fundLoan(loan.id)}
                            disabled={lendingLoading || loan.borrower === address}
                          >
                            Fund Loan
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Funded Loans */}
            {lenderLoans.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>My Funded Loans</CardTitle>
                  <CardDescription>Loans you've funded as a lender</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lenderLoans.map((loan) => (
                      <Card key={loan.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{loan.amount} USDC</p>
                              <p className="text-xs text-muted-foreground">
                                Expected: {loan.totalRepayment} USDC
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              loan.status === 'Funded' ? 'bg-blue-100 text-blue-800' :
                              loan.status === 'Repaid' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {loan.status}
                            </span>
                          </div>
                          <div className="text-xs">
                            <p>Interest: {loan.interestRate}%</p>
                            <p>Duration: {Math.floor(Number(loan.duration) / 86400)} days</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Staking Section */}
          <TabsContent value="staking" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Staking Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Stake CRDX Tokens</CardTitle>
                  <CardDescription>
                    Stake your tokens to earn rewards
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span>CRDX Balance: {parseFloat(stakingTokenBalance).toFixed(2)}</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => mintStakingTokens('1000')}
                      >
                        Get Test CRDX
                      </Button>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleStake} className="space-y-4">
                    <div>
                      <Label htmlFor="stakeAmount">Amount to Stake</Label>
                      <Input
                        id="stakeAmount"
                        type="number"
                        step="0.01"
                        placeholder="100"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={stakingLoading}>
                      {stakingLoading ? 'Staking...' : 'Stake Tokens'}
                    </Button>
                  </form>

                  <div className="border-t pt-4">
                    <form onSubmit={handleUnstake} className="space-y-4">
                      <div>
                        <Label htmlFor="unstakeAmount">Amount to Unstake</Label>
                        <Input
                          id="unstakeAmount"
                          type="number"
                          step="0.01"
                          placeholder="50"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" variant="outline" disabled={stakingLoading}>
                        {stakingLoading ? 'Unstaking...' : 'Unstake Tokens'}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>

              {/* Staking Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Staking Info</CardTitle>
                  <CardDescription>View your staking position and rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Staked Balance</p>
                        <p className="text-2xl font-bold">{parseFloat(stakingInfo.stakedBalance).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">CRDX</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Earned Rewards</p>
                        <p className="text-2xl font-bold text-green-600">
                          {parseFloat(stakingInfo.earnedRewards).toFixed(6)}
                        </p>
                        <p className="text-xs text-muted-foreground">CRDX</p>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Total Pool Staked</span>
                        <span className="font-semibold">{parseFloat(stakingInfo.totalPoolStaked).toFixed(2)} CRDX</span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Current APY</span>
                        <span className="font-semibold text-green-600">{stakingInfo.apy}%</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={claimReward}
                      disabled={stakingLoading || parseFloat(stakingInfo.earnedRewards) === 0}
                    >
                      Claim Rewards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aave Protocol Section */}
          <TabsContent value="aave" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Aave Protocol Integration
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
                <CardDescription>
                  Access Aave V3 lending and borrowing markets directly from this platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Aave Info */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">About Aave Integration</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Aave is a decentralized lending protocol where users can supply assets to earn interest 
                    or borrow assets against their collateral. This integration allows you to interact with 
                    Aave V3 markets directly.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Chain</p>
                      <p className="font-semibold">Chain ID: {chainId || 'Not Connected'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Available Chains</p>
                      <p className="font-semibold">{availableChains.length} Supported</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => chainId && fetchMarkets(chainId)}
                    disabled={!chainId || aaveLoading}
                    className="w-full"
                  >
                    {aaveLoading ? 'Loading...' : 'Fetch Aave Markets'}
                  </Button>
                  <Button
                    onClick={() => chainId && fetchUserPositions(chainId)}
                    disabled={!chainId || !address || aaveLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {aaveLoading ? 'Loading...' : 'Fetch My Positions'}
                  </Button>
                </div>

                {/* Error Display */}
                {aaveError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive">{aaveError}</p>
                  </div>
                )}

                {/* Markets Display */}
                {aaveMarkets.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Available Markets</h3>
                    <div className="space-y-2">
                      {aaveMarkets.map((market) => (
                        <Card key={market.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{market.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {market.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                <span className="text-green-600">Supply APY: {market.supplyApy}%</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-orange-600">Borrow APY: {market.borrowApy}%</span>
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Positions Display */}
                {userPositions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Your Positions</h3>
                    <div className="space-y-2">
                      {userPositions.map((position, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{position.symbol}</p>
                              <p className="text-xs text-muted-foreground">{position.underlyingAsset}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p>Supplied: {position.currentATokenBalance}</p>
                              <p>Borrowed: {position.currentVariableDebt}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!aaveLoading && aaveMarkets.length === 0 && userPositions.length === 0 && !aaveError && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Click "Fetch Aave Markets" to view available lending markets</p>
                    <p className="text-sm mt-2">Connect your wallet and fetch positions to see your Aave assets</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
