import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Reserve } from '@/hooks/useAave';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Zap, Shield, TrendingUp, AlertCircle } from 'lucide-react';

interface ReserveDetailsProps {
  reserve: Reserve;
  open: boolean;
  onClose: () => void;
}

export function ReserveDetails({ reserve, open, onClose }: ReserveDetailsProps) {
  const formatPercent = (value: string) => {
    const num = parseFloat(value) * 100;
    return `${num.toFixed(2)}%`;
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{reserve.underlyingToken.symbol}</DialogTitle>
              <DialogDescription>{reserve.underlyingToken.name}</DialogDescription>
            </div>
            <div className="flex gap-2">
              {reserve.isFrozen && <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Frozen</Badge>}
              {reserve.isPaused && <Badge variant="destructive">Paused</Badge>}
              {reserve.flashLoanEnabled && <Badge variant="secondary"><Zap className="h-3 w-3 mr-1" />Flash Loans</Badge>}
              {reserve.permitSupported && <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Permit</Badge>}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="supply" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="supply">Supply Info</TabsTrigger>
            <TabsTrigger value="borrow">Borrow Info</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="supply" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Supply APY</p>
                <p className="text-2xl font-bold text-primary">{formatPercent(reserve.supplyInfo.apy)}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Supplied</p>
                <p className="text-2xl font-bold">{formatNumber(reserve.supplyInfo.total)}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Max LTV</p>
                <p className="text-lg font-semibold">{formatPercent(reserve.supplyInfo.maxLTV)}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Liquidation Threshold</p>
                <p className="text-lg font-semibold">{formatPercent(reserve.supplyInfo.liquidationThreshold)}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Liquidation Bonus</p>
                <p className="text-lg font-semibold">{formatPercent(reserve.supplyInfo.liquidationBonus)}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Can Be Collateral</p>
                <p className="text-lg font-semibold">{reserve.supplyInfo.canBeCollateral ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>

            {reserve.supplyInfo.supplyCap !== '0' && (
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Supply Cap</p>
                <p className="text-lg font-semibold">{formatNumber(reserve.supplyInfo.supplyCap)}</p>
                {reserve.supplyInfo.supplyCapReached && (
                  <Badge variant="destructive" className="mt-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Cap Reached
                  </Badge>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="borrow" className="space-y-4">
            {reserve.borrowInfo ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Borrow APY</p>
                    <p className="text-2xl font-bold text-destructive">{formatPercent(reserve.borrowInfo.apy)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Available Liquidity</p>
                    <p className="text-2xl font-bold">{formatNumber(reserve.borrowInfo.availableLiquidity)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Borrowed</p>
                    <p className="text-lg font-semibold">{formatNumber(reserve.borrowInfo.total)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Utilization Rate</p>
                    <p className="text-lg font-semibold">{formatPercent(reserve.borrowInfo.utilizationRate)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Reserve Factor</p>
                    <p className="text-lg font-semibold">{formatPercent(reserve.borrowInfo.reserveFactor)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Optimal Usage</p>
                    <p className="text-lg font-semibold">{formatPercent(reserve.borrowInfo.optimalUsageRate)}</p>
                  </div>
                </div>

                {reserve.borrowInfo.borrowCap !== '0' && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Borrow Cap</p>
                    <p className="text-lg font-semibold">{formatNumber(reserve.borrowInfo.borrowCap)}</p>
                    {reserve.borrowInfo.borrowCapReached && (
                      <Badge variant="destructive" className="mt-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Cap Reached
                      </Badge>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Borrowing is not enabled for this asset
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Token Addresses */}
            <div className="space-y-2">
              <h3 className="font-semibold">Token Addresses</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">Underlying:</span>
                  <span className="font-mono">{reserve.underlyingToken.address.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">aToken:</span>
                  <span className="font-mono">{reserve.aToken.address.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">Variable Debt:</span>
                  <span className="font-mono">{reserve.vToken.address.slice(0, 10)}...</span>
                </div>
              </div>
            </div>

            {/* E-Mode Info */}
            {reserve.eModeInfo.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">E-Mode Categories</h3>
                {reserve.eModeInfo.map((eMode) => (
                  <div key={eMode.categoryId} className="p-3 border rounded-lg">
                    <p className="font-semibold mb-2">{eMode.label}</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Max LTV</p>
                        <p className="font-medium">{formatPercent(eMode.maxLTV)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Liq. Threshold</p>
                        <p className="font-medium">{formatPercent(eMode.liquidationThreshold)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Liq. Penalty</p>
                        <p className="font-medium">{formatPercent(eMode.liquidationPenalty)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Isolation Mode */}
            {reserve.isolationModeConfig && (
              <div className="space-y-2">
                <h3 className="font-semibold">Isolation Mode</h3>
                <div className="p-3 border rounded-lg bg-yellow-500/10">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Debt Ceiling</p>
                      <p className="font-medium">{formatNumber(reserve.isolationModeConfig.debtCeiling)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Borrows</p>
                      <p className="font-medium">{formatNumber(reserve.isolationModeConfig.totalBorrows)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Can Be Collateral</p>
                      <p className="font-medium">{reserve.isolationModeConfig.canBeCollateral ? '✅' : '❌'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Can Be Borrowed</p>
                      <p className="font-medium">{reserve.isolationModeConfig.canBeBorrowed ? '✅' : '❌'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Incentives */}
            {reserve.incentives.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Incentives</h3>
                {reserve.incentives.map((incentive, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-primary/10">
                    <p className="font-semibold">{incentive.type}</p>
                    {incentive.extraApr && <p className="text-sm">Extra APR: {formatPercent(incentive.extraApr)}</p>}
                    {incentive.rewardTokenSymbol && <p className="text-sm">Reward: {incentive.rewardTokenSymbol}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
