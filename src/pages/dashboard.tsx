import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { HealthFactorBar } from '@/components/HealthFactorBar';
import { MarketTable } from '@/components/MarketTable';
import { SUPPORTED_TOKENS } from '@/config/tokens';
import { formatCurrency, formatAPY } from '@/lib/format';
import { useState } from 'react';
import { RepayModal } from '@/components/RepayModal';
import { WithdrawModal } from '@/components/WithdrawModal';

export default function Dashboard() {
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('0');

  // Mock data for user positions
  const userSupplies = [
    { token: SUPPORTED_TOKENS[0], amount: '2.5', value: 5000, apy: 2.5 },
    { token: SUPPORTED_TOKENS[1], amount: '1000', value: 1000, apy: 8.5 },
  ];

  const userBorrows = [
    { token: SUPPORTED_TOKENS[1], amount: '500', value: 500, apy: 12.3 },
  ];

  const totalSupplied = userSupplies.reduce((sum, supply) => sum + supply.value, 0);
  const totalBorrowed = userBorrows.reduce((sum, borrow) => sum + borrow.value, 0);
  const netWorth = totalSupplied - totalBorrowed;

  const handleRepay = (tokenSymbol: string, amount: string) => {
    setSelectedToken(tokenSymbol);
    setSelectedAmount(amount);
    setRepayModalOpen(true);
  };

  const handleWithdraw = (tokenSymbol: string, amount: string) => {
    setSelectedToken(tokenSymbol);
    setSelectedAmount(amount);
    setWithdrawModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text">
              Your Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Monitor your lending and borrowing positions
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="font-medium text-muted-foreground mb-2">Net Worth</h3>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(netWorth)}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium text-muted-foreground mb-2">Total Supplied</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(totalSupplied)}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium text-muted-foreground mb-2">Total Borrowed</h3>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totalBorrowed)}
              </p>
            </Card>
          </div>

          {/* Health Factor */}
          <HealthFactorBar healthFactor="2.45" />

          {/* User Positions */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Supplies */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Supplies</h3>
              {userSupplies.length > 0 ? (
                <div className="space-y-4">
                  {userSupplies.map((supply) => (
                    <div key={supply.token.symbol} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={supply.token.logo} 
                          alt={supply.token.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div>
                          <div className="font-medium">{supply.amount} {supply.token.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(supply.value)} • APY {formatAPY(supply.apy)}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleWithdraw(supply.token.symbol, supply.amount)}
                      >
                        Withdraw
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No supplies yet. Start by depositing assets to earn interest.
                </p>
              )}
            </Card>

            {/* Borrows */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Borrows</h3>
              {userBorrows.length > 0 ? (
                <div className="space-y-4">
                  {userBorrows.map((borrow) => (
                    <div key={borrow.token.symbol} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={borrow.token.logo} 
                          alt={borrow.token.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div>
                          <div className="font-medium">{borrow.amount} {borrow.token.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(borrow.value)} • APY {formatAPY(borrow.apy)}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="button-gradient"
                        onClick={() => handleRepay(borrow.token.symbol, borrow.amount)}
                      >
                        Repay
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No active borrows. You can borrow against your collateral.
                </p>
              )}
            </Card>
          </div>

          {/* Markets */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Available Markets</h2>
            <MarketTable />
          </div>
        </div>
      </main>

      <RepayModal 
        open={repayModalOpen}
        onOpenChange={setRepayModalOpen}
        tokenSymbol={selectedToken}
        borrowedAmount={selectedAmount}
      />
      
      <WithdrawModal 
        open={withdrawModalOpen}
        onOpenChange={setWithdrawModalOpen}
        tokenSymbol={selectedToken}
        suppliedAmount={selectedAmount}
      />
    </div>
  );
}