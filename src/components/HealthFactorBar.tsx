import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { formatHealthFactor, getHealthFactorColor } from '@/lib/format';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface HealthFactorBarProps {
  healthFactor: string;
  className?: string;
}

export const HealthFactorBar = ({ healthFactor, className = '' }: HealthFactorBarProps) => {
  const hf = parseFloat(healthFactor);
  const isHealthy = hf >= 1.5;
  const isRisky = hf < 1.2;
  const isCritical = hf < 1.05;

  // Convert health factor to progress percentage (inverse relationship)
  // Higher HF = lower risk = higher progress value
  const getProgressValue = (hf: number): number => {
    if (hf >= 2) return 100;
    if (hf >= 1.5) return 80;
    if (hf >= 1.2) return 60;
    if (hf >= 1.05) return 30;
    return 10;
  };

  const progressValue = getProgressValue(hf);
  
  const getStatusIcon = () => {
    if (isCritical) return <XCircle className="h-4 w-4 text-red-500" />;
    if (isRisky) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getHealthStatus = () => {
    if (isCritical) return 'Critical Risk';
    if (isRisky) return 'High Risk';
    if (isHealthy) return 'Healthy';
    return 'Moderate Risk';
  };

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isRisky) return 'bg-orange-500';
    if (isHealthy) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Health Factor</span>
          </div>
          <div className="text-right">
            <div className={`font-bold text-lg ${getHealthFactorColor(hf)}`}>
              {formatHealthFactor(BigInt(Math.floor(hf * 1e18)))}
            </div>
            <div className="text-xs text-muted-foreground">
              {getHealthStatus()}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress 
            value={progressValue} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Liquidation Risk</span>
            <span>Safe</span>
          </div>
        </div>

        {isCritical && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Liquidation Warning
            </div>
            <p className="text-xs text-red-500/80 mt-1">
              Your position is at risk of liquidation. Consider repaying debt or adding collateral.
            </p>
          </div>
        )}

        {isRisky && !isCritical && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-500 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              High Risk
            </div>
            <p className="text-xs text-orange-500/80 mt-1">
              Monitor your health factor closely to avoid liquidation.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};