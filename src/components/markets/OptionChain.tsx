import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { CryptoAsset } from '@/hooks/useMarketData';

interface OptionChainProps {
  asset: CryptoAsset;
}

type Expiry = '1W' | '2W' | '1M' | '3M';

interface OptionRow {
  strike: number;
  callBid: number;
  callAsk: number;
  callIV: number;
  callDelta: number;
  putBid: number;
  putAsk: number;
  putIV: number;
  putDelta: number;
  isITMCall: boolean;
  isITMPut: boolean;
  isATM: boolean;
}

const EXPIRY_DAYS: Record<Expiry, number> = { '1W': 7, '2W': 14, '1M': 30, '3M': 90 };

function generateStrikes(price: number): number[] {
  const magnitude = Math.pow(10, Math.floor(Math.log10(price)));
  let step: number;
  if (price >= 10000) step = magnitude * 0.05;
  else if (price >= 100) step = magnitude * 0.05;
  else if (price >= 1) step = price * 0.05;
  else step = price * 0.1;

  step = Math.max(step, price * 0.02);
  const strikes: number[] = [];
  for (let i = -8; i <= 8; i++) {
    const s = price + i * step;
    if (s > 0) strikes.push(parseFloat(s.toPrecision(4)));
  }
  return strikes;
}

function simulateOptionData(
  price: number,
  strike: number,
  daysToExpiry: number,
  baseVolatility: number
): { callBid: number; callAsk: number; callIV: number; callDelta: number; putBid: number; putAsk: number; putIV: number; putDelta: number } {
  const T = daysToExpiry / 365;
  const sigma = baseVolatility / 100;
  const sqrtT = Math.sqrt(T);

  // Simplified delta approximation
  const d1 = Math.log(price / strike) / (sigma * sqrtT) + 0.5 * sigma * sqrtT;
  const callDelta = Math.min(0.99, Math.max(0.01, 0.5 * (1 + erf(d1 / Math.SQRT2))));
  const putDelta = callDelta - 1;

  // Intrinsic values
  const callIntrinsic = Math.max(0, price - strike);
  const putIntrinsic = Math.max(0, strike - price);

  // Time value approximation
  const timeValue = price * sigma * sqrtT * 0.4;
  const distanceFactor = Math.exp(-Math.pow((price - strike) / (price * 0.1), 2));

  const callPremium = Math.max(callIntrinsic + timeValue * distanceFactor, price * 0.001);
  const putPremium = Math.max(putIntrinsic + timeValue * distanceFactor, price * 0.001);

  // Spread: 1-3% of premium
  const spreadPct = 0.01 + Math.random() * 0.02;

  // IV varies by strike distance
  const moneyness = Math.abs(price - strike) / price;
  const ivSkew = 1 + moneyness * 0.5; // Volatility smile
  const iv = baseVolatility * ivSkew * (0.95 + Math.random() * 0.1);

  return {
    callBid: callPremium * (1 - spreadPct),
    callAsk: callPremium * (1 + spreadPct),
    callIV: iv,
    callDelta,
    putBid: putPremium * (1 - spreadPct),
    putAsk: putPremium * (1 + spreadPct),
    putIV: iv * (0.98 + Math.random() * 0.04),
    putDelta: Math.abs(putDelta),
  };
}

// Error function approximation
function erf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export function OptionChain({ asset }: OptionChainProps) {
  const [expiry, setExpiry] = useState<Expiry>('1M');

  const baseVolatility = useMemo(() => {
    return Math.max(20, Math.abs(asset.priceChange7d || 5) * 5);
  }, [asset.priceChange7d]);

  const optionRows: OptionRow[] = useMemo(() => {
    const strikes = generateStrikes(asset.price);
    const days = EXPIRY_DAYS[expiry];

    return strikes.map((strike) => {
      const data = simulateOptionData(asset.price, strike, days, baseVolatility);
      const isATM = Math.abs(strike - asset.price) / asset.price < 0.025;
      return {
        strike,
        ...data,
        isITMCall: strike < asset.price,
        isITMPut: strike > asset.price,
        isATM,
      };
    });
  }, [asset.price, expiry, baseVolatility]);

  const formatOptionPrice = (val: number) => {
    if (val >= 1) return `$${val.toFixed(2)}`;
    if (val >= 0.01) return `$${val.toFixed(4)}`;
    return `$${val.toFixed(6)}`;
  };

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold">Simulated Option Chain</span> — Prices and Greeks are algorithmically generated for educational purposes and do not represent real market quotes.
        </p>
      </div>

      {/* Asset Info + Expiry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src={asset.logo} alt={asset.name} className="w-8 h-8 rounded-full" />
          <div>
            <h3 className="font-semibold text-sm">{asset.symbol} Options</h3>
            <p className="text-xs text-muted-foreground">Spot: {formatPrice(asset.price)}</p>
          </div>
          <Badge variant="outline" className="text-[10px]">IV: {baseVolatility.toFixed(0)}%</Badge>
        </div>

        <Tabs value={expiry} onValueChange={(v) => setExpiry(v as Expiry)}>
          <TabsList className="h-8">
            {(['1W', '2W', '1M', '3M'] as Expiry[]).map((e) => (
              <TabsTrigger key={e} value={e} className="text-xs px-3 h-6">{e}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Option Chain Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto mobile-scroll">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th colSpan={4} className="text-center p-2 font-semibold text-green-400 bg-green-500/5 border-r border-border/30">
                  CALLS
                </th>
                <th className="text-center p-2 font-semibold text-muted-foreground">Strike</th>
                <th colSpan={4} className="text-center p-2 font-semibold text-red-400 bg-red-500/5 border-l border-border/30">
                  PUTS
                </th>
              </tr>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-right p-2 font-medium bg-green-500/5">Bid</th>
                <th className="text-right p-2 font-medium bg-green-500/5">Ask</th>
                <th className="text-right p-2 font-medium bg-green-500/5">IV</th>
                <th className="text-right p-2 font-medium bg-green-500/5 border-r border-border/30">Δ</th>
                <th className="text-center p-2 font-medium">Price</th>
                <th className="text-right p-2 font-medium bg-red-500/5 border-l border-border/30">Δ</th>
                <th className="text-right p-2 font-medium bg-red-500/5">IV</th>
                <th className="text-right p-2 font-medium bg-red-500/5">Bid</th>
                <th className="text-right p-2 font-medium bg-red-500/5">Ask</th>
              </tr>
            </thead>
            <tbody>
              {optionRows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/20 transition-colors hover:bg-muted/30 ${
                    row.isATM
                      ? 'bg-primary/10 border-primary/30'
                      : row.isITMCall
                      ? 'bg-green-500/[0.03]'
                      : ''
                  }`}
                >
                  {/* Call side */}
                  <td className={`text-right p-2 font-mono ${row.isITMCall ? 'text-green-400' : 'text-foreground'}`}>
                    {formatOptionPrice(row.callBid)}
                  </td>
                  <td className={`text-right p-2 font-mono ${row.isITMCall ? 'text-green-400' : 'text-foreground'}`}>
                    {formatOptionPrice(row.callAsk)}
                  </td>
                  <td className="text-right p-2 text-muted-foreground">{row.callIV.toFixed(1)}%</td>
                  <td className="text-right p-2 text-muted-foreground border-r border-border/30">{row.callDelta.toFixed(2)}</td>

                  {/* Strike */}
                  <td className={`text-center p-2 font-semibold font-mono ${row.isATM ? 'text-primary' : 'text-foreground'}`}>
                    {formatPrice(row.strike)}
                    {row.isATM && <span className="ml-1 text-[9px] text-primary">ATM</span>}
                  </td>

                  {/* Put side */}
                  <td className="text-right p-2 text-muted-foreground border-l border-border/30">{row.putDelta.toFixed(2)}</td>
                  <td className="text-right p-2 text-muted-foreground">{row.putIV.toFixed(1)}%</td>
                  <td className={`text-right p-2 font-mono ${row.isITMPut ? 'text-red-400' : 'text-foreground'}`}>
                    {formatOptionPrice(row.putBid)}
                  </td>
                  <td className={`text-right p-2 font-mono ${row.isITMPut ? 'text-red-400' : 'text-foreground'}`}>
                    {formatOptionPrice(row.putAsk)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
