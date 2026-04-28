import { useMemo, useState } from "react";
import { ExchangeSelector } from "./ExchangeSelector";
import { LiveTickerBar } from "./LiveTickerBar";
import { OrderBookPanel } from "./OrderBookPanel";
import { TradeTape } from "./TradeTape";
import { CandlestickChart } from "./CandlestickChart";
import { FundingRateBadge } from "./FundingRateBadge";
import { ArbitrageStrip } from "./ArbitrageStrip";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  SUPPORTED_EXCHANGES,
  toExchangeSymbol,
  type ExchangeId,
} from "@/lib/exchangeSymbols";
import type { CryptoAsset } from "@/hooks/useMarketData";
import { Search } from "lucide-react";

interface Props {
  assets: CryptoAsset[];
  initialAssetId?: string | null;
}

const QUICK_PICKS = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "dogecoin"];

export function RealtimePanel({ assets, initialAssetId }: Props) {
  const [exchange, setExchange] = useState<ExchangeId>("binance");
  const [assetId, setAssetId] = useState<string>(initialAssetId || "bitcoin");
  const [query, setQuery] = useState("");

  const exchangeMeta = useMemo(
    () => SUPPORTED_EXCHANGES.find((e) => e.id === exchange)!,
    [exchange],
  );

  const symbol = useMemo(
    () => toExchangeSymbol(assetId, { exchange, preferredQuote: exchangeMeta.quote }),
    [assetId, exchange, exchangeMeta.quote],
  );

  const filtered = assets
    .filter((a) =>
      query
        ? a.symbol.toLowerCase().includes(query.toLowerCase()) ||
          a.name.toLowerCase().includes(query.toLowerCase())
        : true,
    )
    .slice(0, 12);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <Card className="glass-card p-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <ExchangeSelector value={exchange} onChange={setExchange} />
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search asset…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(query ? filtered : assets.filter((a) => QUICK_PICKS.includes(a.id)))
            .slice(0, query ? 12 : 6)
            .map((a) => (
              <button
                key={a.id}
                onClick={() => setAssetId(a.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors ${
                  assetId === a.id
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border/40 hover:border-border/80 text-muted-foreground"
                }`}
              >
                <img src={a.logo} alt="" className="w-4 h-4 rounded-full" />
                {a.symbol}
              </button>
            ))}
        </div>
      </Card>

      <LiveTickerBar exchange={exchange} symbol={symbol} />

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <CandlestickChart exchange={exchange} symbol={symbol} />
          <ArbitrageStrip symbol={toExchangeSymbol(assetId, { preferredQuote: "USDT" })} />
          <FundingRateBadge symbol={toExchangeSymbol(assetId, { preferredQuote: "USDT" })} />
        </div>
        <div className="space-y-3">
          <OrderBookPanel exchange={exchange} symbol={symbol} />
          <TradeTape exchange={exchange} symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
