import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Loader2 } from 'lucide-react';
import { CryptoAsset } from '@/hooks/useMarketData';
import { GenerateStrategyParams } from '@/hooks/useStrategyBuilder';

interface StrategyFormProps {
  assets: CryptoAsset[];
  isGenerating: boolean;
  onGenerate: (params: GenerateStrategyParams) => void;
}

const STRATEGY_TYPES = [
  { value: 'momentum', label: 'Momentum', desc: 'Trend-following based on price momentum' },
  { value: 'mean_reversion', label: 'Mean Reversion', desc: 'Buy low, sell high around averages' },
  { value: 'breakout', label: 'Breakout', desc: 'Trade support/resistance breakouts' },
  { value: 'dca', label: 'DCA', desc: 'Dollar-cost averaging accumulation' },
  { value: 'scalping', label: 'Scalping', desc: 'Quick short-term trades' },
];

const TIMEFRAMES = [
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
];

const RISK_LABELS: Record<number, string> = { 0: 'Conservative', 50: 'Moderate', 100: 'Aggressive' };

export default function StrategyForm({ assets, isGenerating, onGenerate }: StrategyFormProps) {
  const [assetId, setAssetId] = useState('bitcoin');
  const [strategyType, setStrategyType] = useState('momentum');
  const [riskValue, setRiskValue] = useState([50]);
  const [investmentAmount, setInvestmentAmount] = useState('1000');
  const [timeframe, setTimeframe] = useState('1W');

  const getRiskLevel = (v: number) => v <= 25 ? 'conservative' : v <= 75 ? 'moderate' : 'aggressive';
  const getRiskLabel = (v: number) => v <= 25 ? 'Conservative' : v <= 75 ? 'Moderate' : 'Aggressive';

  const selectedAsset = assets.find(a => a.id === assetId);

  const handleSubmit = () => {
    if (!selectedAsset) return;
    onGenerate({
      assetSymbol: selectedAsset.symbol,
      assetId: selectedAsset.id,
      strategyType,
      riskLevel: getRiskLevel(riskValue[0]),
      timeframe,
      investmentAmount: parseFloat(investmentAmount) || 1000,
    });
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cpu className="w-5 h-5 text-primary" />
          Configure Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {assets.slice(0, 30).map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2">
                      <img src={a.logo} alt="" className="w-4 h-4 rounded-full" />
                      {a.symbol} - {a.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAsset && (
              <p className="text-xs text-muted-foreground">
                Current: ${selectedAsset.price.toLocaleString()} ({selectedAsset.priceChange24h >= 0 ? '+' : ''}{selectedAsset.priceChange24h.toFixed(2)}%)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Strategy Type</Label>
            <Select value={strategyType} onValueChange={setStrategyType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STRATEGY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex flex-col">
                      <span>{t.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {STRATEGY_TYPES.find(t => t.value === strategyType)?.desc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Investment Amount ($)</Label>
            <Input
              type="number"
              value={investmentAmount}
              onChange={e => setInvestmentAmount(e.target.value)}
              min={10}
              placeholder="1000"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Risk Tolerance</Label>
            <span className={`text-sm font-semibold ${
              riskValue[0] <= 25 ? 'text-green-400' : riskValue[0] <= 75 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {getRiskLabel(riskValue[0])}
            </span>
          </div>
          <Slider
            value={riskValue}
            onValueChange={setRiskValue}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isGenerating || !selectedAsset}
          className="w-full button-gradient h-11"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating AI Strategy...
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 mr-2" />
              Generate AI Strategy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
