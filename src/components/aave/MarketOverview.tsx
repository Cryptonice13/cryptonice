import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AaveMarket } from '@/hooks/useAave';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { formatUnits } from 'ethers';

interface MarketOverviewProps {
  market: AaveMarket;
}

export function MarketOverview({ market }: MarketOverviewProps) {
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (value: string) => {
    const num = parseFloat(value) * 100;
    return `${num.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Market Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{market.name}</h2>
          <p className="text-muted-foreground">{market.chain.name}</p>
        </div>
        {market.icon && (
          <img src={market.icon} alt={market.name} className="w-12 h-12 rounded-full" />
        )}
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(market.totalMarketSize)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Liquidity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(market.totalAvailableLiquidity)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supply Reserves</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{market.supplyReserves.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Assets available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borrow Reserves</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{market.borrowReserves.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Assets borrowable</p>
          </CardContent>
        </Card>
      </div>

      {/* User State if available */}
      {market.userState && (
        <Card>
          <CardHeader>
            <CardTitle>Your Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Net Worth</p>
                <p className="text-lg font-semibold">{formatCurrency(market.userState.netWorth)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net APY</p>
                <p className="text-lg font-semibold text-primary">{formatPercent(market.userState.netAPY)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Factor</p>
                <p className={`text-lg font-semibold ${parseFloat(market.userState.healthFactor) > 1.5 ? 'text-primary' : 'text-destructive'}`}>
                  {parseFloat(market.userState.healthFactor).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collateral</p>
                <p className="text-lg font-semibold">{formatCurrency(market.userState.totalCollateralBase)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* E-Mode Categories */}
      {market.eModeCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>E-Mode Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {market.eModeCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{category.label}</p>
                    <p className="text-xs text-muted-foreground">Category {category.id}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>Max LTV: {formatPercent(category.maxLTV)}</p>
                    <p>Liq. Threshold: {formatPercent(category.liquidationThreshold)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
