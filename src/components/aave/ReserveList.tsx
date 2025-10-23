import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reserve } from '@/hooks/useAave';
import { TrendingUp, TrendingDown, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { ReserveDetails } from './ReserveDetails';

interface ReserveListProps {
  supplyReserves: Reserve[];
  borrowReserves: Reserve[];
  onSupply: (reserve: Reserve) => void;
  onBorrow: (reserve: Reserve) => void;
  onWithdraw: (reserve: Reserve) => void;
  onRepay: (reserve: Reserve) => void;
}

export function ReserveList({ 
  supplyReserves, 
  borrowReserves, 
  onSupply, 
  onBorrow,
  onWithdraw,
  onRepay 
}: ReserveListProps) {
  const [selectedReserve, setSelectedReserve] = useState<Reserve | null>(null);

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

  const ReserveCard = ({ reserve, type }: { reserve: Reserve; type: 'supply' | 'borrow' }) => {
    const info = type === 'supply' ? reserve.supplyInfo : reserve.borrowInfo;
    if (!info) return null;

    return (
      <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedReserve(reserve)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">{reserve.underlyingToken.symbol}</h3>
              <p className="text-xs text-muted-foreground">{reserve.underlyingToken.name}</p>
            </div>
            <div className="flex gap-1">
              {reserve.isFrozen && <Badge variant="outline" className="text-xs"><Lock className="h-3 w-3" /></Badge>}
              {reserve.isPaused && <Badge variant="destructive" className="text-xs">Paused</Badge>}
              {reserve.isolationModeConfig && <Badge variant="secondary" className="text-xs">Isolated</Badge>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">APY</span>
              <span className={`font-semibold ${type === 'supply' ? 'text-primary' : 'text-destructive'}`}>
                {formatPercent(info.apy)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="text-sm font-medium">
                {type === 'supply' 
                  ? formatNumber(reserve.supplyInfo.total) 
                  : formatNumber(reserve.borrowInfo?.availableLiquidity || '0')}
              </span>
            </div>

            {type === 'supply' && reserve.supplyInfo.canBeCollateral && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max LTV</span>
                <span className="text-sm">{formatPercent(reserve.supplyInfo.maxLTV)}</span>
              </div>
            )}

            {type === 'borrow' && reserve.borrowInfo && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Utilization</span>
                <span className="text-sm">{formatPercent(reserve.borrowInfo.utilizationRate)}</span>
              </div>
            )}

            {reserve.incentives.length > 0 && (
              <Badge variant="secondary" className="text-xs w-full justify-center">
                🎁 Incentives Available
              </Badge>
            )}
          </div>

          {reserve.userState && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Your Position</p>
              <div className="flex justify-between text-sm">
                <span>Balance:</span>
                <span className="font-semibold">{formatNumber(reserve.userState.balance)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            {type === 'supply' ? (
              <>
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onSupply(reserve); }} className="flex-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Supply
                </Button>
                {reserve.userState && parseFloat(reserve.userState.balance) > 0 && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onWithdraw(reserve); }} className="flex-1">
                    Withdraw
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onBorrow(reserve); }} className="flex-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Borrow
                </Button>
                {reserve.userState && parseFloat(reserve.userState.balance) > 0 && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onRepay(reserve); }} className="flex-1">
                    Repay
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Tabs defaultValue="supply" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="supply">
            <TrendingUp className="h-4 w-4 mr-2" />
            Supply Assets ({supplyReserves.length})
          </TabsTrigger>
          <TabsTrigger value="borrow">
            <TrendingDown className="h-4 w-4 mr-2" />
            Borrow Assets ({borrowReserves.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supply" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplyReserves.map((reserve, idx) => (
              <ReserveCard key={`supply-${reserve.underlyingToken.address}-${idx}`} reserve={reserve} type="supply" />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="borrow" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {borrowReserves.map((reserve, idx) => (
              <ReserveCard key={`borrow-${reserve.underlyingToken.address}-${idx}`} reserve={reserve} type="borrow" />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedReserve && (
        <ReserveDetails 
          reserve={selectedReserve} 
          open={!!selectedReserve}
          onClose={() => setSelectedReserve(null)}
        />
      )}
    </>
  );
}
