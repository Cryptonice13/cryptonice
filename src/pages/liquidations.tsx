import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { SUPPORTED_TOKENS } from '@/config/tokens';
import { formatCurrency, formatHealthFactor } from '@/lib/format';
import { AlertTriangle } from 'lucide-react';

export default function Liquidations() {
  // Mock data for positions at risk
  const riskPositions = [
    {
      user: '0x1234...5678',
      collateral: { token: SUPPORTED_TOKENS[0], amount: '1.5', value: 3000 },
      debt: { token: SUPPORTED_TOKENS[1], amount: '2400', value: 2400 },
      healthFactor: '1.08',
      liquidationBonus: '5%',
    },
    {
      user: '0x9876...4321',
      collateral: { token: SUPPORTED_TOKENS[1], amount: '5000', value: 5000 },
      debt: { token: SUPPORTED_TOKENS[0], amount: '2.1', value: 4200 },
      healthFactor: '1.12',
      liquidationBonus: '5%',
    },
  ];

  const handleLiquidate = (userAddress: string) => {
    console.log('Liquidating position for:', userAddress);
    // Implement liquidation logic
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text flex items-center justify-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              Liquidations
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Monitor and liquidate undercollateralized positions to earn liquidation bonuses
            </p>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Positions at Risk</h2>
              <Badge variant="destructive">
                {riskPositions.length} Positions
              </Badge>
            </div>

            {riskPositions.length > 0 ? (
              <div className="space-y-4">
                {riskPositions.map((position, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-mono text-sm">{position.user}</div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="destructive" 
                            className="text-xs"
                          >
                            HF: {position.healthFactor}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Bonus: {position.liquidationBonus}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={() => handleLiquidate(position.user)}
                      >
                        Liquidate
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-500">Collateral</h4>
                        <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                          <img 
                            src={position.collateral.token.logo} 
                            alt={position.collateral.token.name}
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <div>
                            <div className="font-medium">
                              {position.collateral.amount} {position.collateral.token.symbol}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(position.collateral.value)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-red-500">Debt</h4>
                        <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                          <img 
                            src={position.debt.token.logo} 
                            alt={position.debt.token.name}
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <div>
                            <div className="font-medium">
                              {position.debt.amount} {position.debt.token.symbol}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(position.debt.value)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-500 text-sm font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Liquidation Opportunity
                      </div>
                      <p className="text-xs text-orange-500/80 mt-1">
                        This position can be liquidated. You can earn up to {position.liquidationBonus} bonus.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Liquidations Available</h3>
                <p className="text-muted-foreground">
                  All positions are healthy. Check back later for liquidation opportunities.
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}