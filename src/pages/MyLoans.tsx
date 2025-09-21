import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLendingStore } from '@/state/lendingStore';
import { useLendingPool } from '@/hooks/useLendingPool';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatPercentage, formatBalance } from '@/lib/format';
import { HealthFactorBar } from '@/components/HealthFactorBar';
import { RepayModal } from '@/components/RepayModal';
import { Token } from '@/config/tokens';

export default function MyLoans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isConnected } = useWallet();
  const { userPositions, totalCollateral, totalDebt, healthFactor, isLoading } = useLendingStore();
  const { getUserAccountData } = useLendingPool();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showRepayModal, setShowRepayModal] = useState(false);

  useEffect(() => {
    if (isConnected) {
      getUserAccountData();
    }
  }, [isConnected, getUserAccountData]);

  // Filter positions to show only borrowed assets
  const borrowedPositions = userPositions.filter(position => 
    parseFloat(position.borrowed) > 0
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          <Card className="bg-card border-border">
            <CardContent className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Wallet Not Connected</p>
              <p className="text-muted-foreground">Please connect your wallet to view your borrow positions.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleRepay = (token: Token) => {
    setSelectedToken(token);
    setShowRepayModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/home")}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <h1 className="text-3xl font-bold mb-4 sm:mb-0">My Borrow Positions</h1>
        </div>

        {/* Account Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Borrowed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <span className="text-2xl font-bold">{formatCurrency(totalDebt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Collateral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{formatCurrency(totalCollateral)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Health Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthFactorBar healthFactor={healthFactor} className="w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Borrowed Positions */}
        <div className="space-y-4">
          {borrowedPositions.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="text-center py-12">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No Active Loans</p>
                <p className="text-muted-foreground mb-4">
                  You haven't borrowed any assets yet. Start by depositing collateral and borrowing against it.
                </p>
                <Button onClick={() => navigate('/markets')}>
                  View Markets
                </Button>
              </CardContent>
            </Card>
          ) : (
            borrowedPositions.map((position) => {
              const borrowedAmount = parseFloat(position.borrowed);
              const interestRate = 5.5; // This would come from contract in real implementation
              const borrowBalance = borrowedAmount;
              
              return (
                <Card key={position.token.symbol} className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={position.token.logo} 
                            alt={position.token.symbol}
                            className="w-8 h-8"
                          />
                          <div>
                            <p className="font-semibold">{position.token.symbol}</p>
                            <p className="text-sm text-muted-foreground">{position.token.name}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Borrowed Amount</p>
                          <p className="font-semibold">
                            {formatBalance(BigInt(Math.floor(borrowedAmount * 1e18)), 18, 4)} {position.token.symbol}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(borrowedAmount * 2000)} {/* Mock price, should come from oracle */}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Borrow APY</p>
                          <div className="flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            <span className="font-semibold">{formatPercentage(interestRate)}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Accrued Interest</p>
                          <p className="font-semibold text-yellow-500">
                            ${(borrowBalance * 0.02).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          Variable Rate
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleRepay(position.token)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Repay
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <img 
                                    src={position.token.logo} 
                                    alt={position.token.symbol}
                                    className="w-6 h-6"
                                  />
                                  {position.token.symbol} Borrow Details
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Principal</p>
                                    <p className="font-semibold">{formatBalance(BigInt(Math.floor(borrowedAmount * 1e18)), 18, 4)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                                    <p className="font-semibold">{formatPercentage(interestRate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Debt Tokens</p>
                                    <p className="font-semibold">{formatBalance(BigInt(position.debtTokenBalance), 18, 4)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Rate Mode</p>
                                    <p className="font-semibold">Variable</p>
                                  </div>
                                </div>
                                
                                <div className="border-t border-border pt-4">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    Interest is calculated and compounded every block
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Risk Warning */}
        {parseFloat(healthFactor) < 1.5 && parseFloat(healthFactor) > 0 && (
          <Card className="bg-destructive/10 border-destructive/20 mt-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">Liquidation Risk Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Your health factor is below 1.5. Consider repaying some debt or adding more collateral to avoid liquidation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Repay Modal */}
        {showRepayModal && selectedToken && (
          <RepayModal
            open={showRepayModal}
            onOpenChange={setShowRepayModal}
            tokenSymbol={selectedToken.symbol}
            borrowedAmount={userPositions.find(p => p.token.symbol === selectedToken.symbol)?.borrowed || '0'}
          />
        )}
      </div>
    </div>
  );
}