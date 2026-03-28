import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import { CryptoAsset } from '@/hooks/useMarketData';
import { DerivativesStrategyParams } from '@/hooks/useStrategyBuilder';

interface DerivativesStrategyFormProps {
  mode: 'options' | 'futures';
  assets: CryptoAsset[];
  isGenerating: boolean;
  onGenerate: (params: DerivativesStrategyParams) => void;
}

const OPTIONS_PRESETS = [
  { value: 'long_call', label: 'Long Call', desc: 'Bullish bet with limited downside' },
  { value: 'long_put', label: 'Long Put', desc: 'Bearish bet with limited downside' },
  { value: 'covered_call', label: 'Covered Call', desc: 'Income on existing holdings' },
  { value: 'straddle', label: 'Straddle', desc: 'Profit from high volatility' },
  { value: 'strangle', label: 'Strangle', desc: 'Cheaper volatility play' },
  { value: 'iron_condor', label: 'Iron Condor', desc: 'Range-bound income strategy' },
];

const EXPIRIES = [
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
];

const FUTURES_CONTRACTS = [
  { value: 'perpetual', label: 'Perpetual' },
  { value: 'quarterly', label: 'Quarterly' },
];

export default function DerivativesStrategyForm({ mode, assets, isGenerating, onGenerate }: DerivativesStrategyFormProps) {
  const [assetId, setAssetId] = useState('bitcoin');
  const [investmentAmount, setInvestmentAmount] = useState('1000');
  const [riskValue, setRiskValue] = useState([50]);

  // Options state
  const [contractType, setContractType] = useState<'call' | 'put'>('call');
  const [strikePrice, setStrikePrice] = useState('');
  const [expiry, setExpiry] = useState('1M');
  const [premiumBudget, setPremiumBudget] = useState('');
  const [optionPreset, setOptionPreset] = useState('long_call');

  // Futures state
  const [leverage, setLeverage] = useState([10]);
  const [futuresContract, setFuturesContract] = useState('perpetual');
  const [positionDirection, setPositionDirection] = useState<'long' | 'short'>('long');
  const [marginType, setMarginType] = useState<'isolated' | 'cross'>('isolated');

  const selectedAsset = assets.find(a => a.id === assetId);
  const getRiskLevel = (v: number) => v <= 25 ? 'conservative' : v <= 75 ? 'moderate' : 'aggressive';
  const getRiskLabel = (v: number) => v <= 25 ? 'Conservative' : v <= 75 ? 'Moderate' : 'Aggressive';

  const handleSubmit = () => {
    if (!selectedAsset) return;
    const params: DerivativesStrategyParams = {
      mode,
      assetSymbol: selectedAsset.symbol,
      assetId: selectedAsset.id,
      investmentAmount: parseFloat(investmentAmount) || 1000,
      riskLevel: getRiskLevel(riskValue[0]),
      ...(mode === 'options' ? {
        contractType,
        strikePrice: parseFloat(strikePrice) || selectedAsset.price,
        expiry,
        premiumBudget: parseFloat(premiumBudget) || undefined,
        optionPreset,
      } : {
        leverage: leverage[0],
        futuresContract,
        positionDirection,
        marginType,
      }),
    };
    onGenerate(params);
  };

  const Icon = mode === 'options' ? TrendingUp : BarChart3;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          Configure {mode === 'options' ? 'Options' : 'Futures'} Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Asset + Investment */}
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
            <Label>Investment Amount ($)</Label>
            <Input type="number" value={investmentAmount} onChange={e => setInvestmentAmount(e.target.value)} min={10} placeholder="1000" />
          </div>
        </div>

        {/* Mode-specific fields */}
        {mode === 'options' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Strategy Preset</Label>
                <Select value={optionPreset} onValueChange={setOptionPreset}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPTIONS_PRESETS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {OPTIONS_PRESETS.find(p => p.value === optionPreset)?.desc}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select value={contractType} onValueChange={(v) => setContractType(v as 'call' | 'put')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call (Bullish)</SelectItem>
                    <SelectItem value="put">Put (Bearish)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Strike Price ($)</Label>
                <Input
                  type="number"
                  value={strikePrice}
                  onChange={e => setStrikePrice(e.target.value)}
                  placeholder={selectedAsset ? `~${selectedAsset.price.toLocaleString()}` : 'Auto'}
                />
                <p className="text-xs text-muted-foreground">Leave empty for AI suggestion</p>
              </div>
              <div className="space-y-2">
                <Label>Expiry</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPIRIES.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Premium Budget ($) <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="number" value={premiumBudget} onChange={e => setPremiumBudget(e.target.value)} placeholder="Auto-calculate" />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position Direction</Label>
                <Select value={positionDirection} onValueChange={(v) => setPositionDirection(v as 'long' | 'short')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Long (Bullish)</SelectItem>
                    <SelectItem value="short">Short (Bearish)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select value={futuresContract} onValueChange={setFuturesContract}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FUTURES_CONTRACTS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Margin Type</Label>
                <Select value={marginType} onValueChange={(v) => setMarginType(v as 'isolated' | 'cross')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isolated">Isolated</SelectItem>
                    <SelectItem value="cross">Cross</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Leverage</Label>
                  <span className={`text-sm font-bold ${leverage[0] <= 10 ? 'text-green-400' : leverage[0] <= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {leverage[0]}x
                  </span>
                </div>
                <Slider value={leverage} onValueChange={setLeverage} min={1} max={125} step={1} className="w-full" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1x</span>
                  <span>50x</span>
                  <span>125x</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Risk Tolerance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Risk Tolerance</Label>
            <span className={`text-sm font-semibold ${riskValue[0] <= 25 ? 'text-green-400' : riskValue[0] <= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
              {getRiskLabel(riskValue[0])}
            </span>
          </div>
          <Slider value={riskValue} onValueChange={setRiskValue} max={100} step={1} className="w-full" />
        </div>

        <Button onClick={handleSubmit} disabled={isGenerating || !selectedAsset} className="w-full button-gradient h-11">
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating {mode === 'options' ? 'Options' : 'Futures'} Strategy...
            </>
          ) : (
            <>
              <Icon className="w-4 h-4 mr-2" />
              Generate {mode === 'options' ? 'Options' : 'Futures'} Strategy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
