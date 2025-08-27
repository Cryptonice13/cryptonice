import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SUPPORTED_TOKENS } from '@/config/tokens';
import { formatAPY, formatCompactNumber, formatCurrency } from '@/lib/format';
import { useState } from 'react';
import { DepositModal } from './DepositModal';
import { BorrowModal } from './BorrowModal';

interface MarketTableProps {
  showSupplyMarkets?: boolean;
  showBorrowMarkets?: boolean;
}

export const MarketTable = ({ 
  showSupplyMarkets = true, 
  showBorrowMarkets = true 
}: MarketTableProps) => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>('');

  const handleDeposit = (tokenSymbol: string) => {
    setSelectedToken(tokenSymbol);
    setDepositModalOpen(true);
  };

  const handleBorrow = (tokenSymbol: string) => {
    setSelectedToken(tokenSymbol);
    setBorrowModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {showSupplyMarkets && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Supply Markets</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Asset</th>
                  <th className="text-left py-3">Total Supplied</th>
                  <th className="text-left py-3">Supply APY</th>
                  <th className="text-right py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {SUPPORTED_TOKENS.map((token) => (
                  <tr key={token.symbol} className="border-b border-border/50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={token.logo} 
                          alt={token.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-muted-foreground">{token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-medium">
                        {formatCompactNumber(parseFloat(token.totalSupply))} {token.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(parseFloat(token.totalSupply) * 2000)}
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="secondary" className="text-green-500">
                        {formatAPY(token.supplyAPY)}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handleDeposit(token.symbol)}
                        className="button-gradient"
                      >
                        Deposit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showBorrowMarkets && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Borrow Markets</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Asset</th>
                  <th className="text-left py-3">Total Borrowed</th>
                  <th className="text-left py-3">Borrow APY</th>
                  <th className="text-right py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {SUPPORTED_TOKENS.map((token) => (
                  <tr key={token.symbol} className="border-b border-border/50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={token.logo} 
                          alt={token.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-muted-foreground">{token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-medium">
                        {formatCompactNumber(parseFloat(token.totalBorrow))} {token.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(parseFloat(token.totalBorrow) * 2000)}
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="secondary" className="text-red-500">
                        {formatAPY(token.borrowAPY)}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBorrow(token.symbol)}
                      >
                        Borrow
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <DepositModal 
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        tokenSymbol={selectedToken}
      />
      
      <BorrowModal 
        open={borrowModalOpen}
        onOpenChange={setBorrowModalOpen}
        tokenSymbol={selectedToken}
      />
    </div>
  );
};