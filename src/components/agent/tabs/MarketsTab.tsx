import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Star, BarChart3, Target, Waves } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketData, type CryptoAsset } from '@/hooks/useMarketData';
import { useWatchlistDb } from '@/hooks/useWatchlistDb';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { MiniSparkline } from '@/components/ai/MiniSparkline';
import { MarketInsightsPanel } from '@/components/ai/MarketInsightsPanel';
import { MarketPredictionCard } from '@/components/ai/MarketPredictionCard';
import { TradingSignalCard } from '@/components/ai/TradingSignalCard';
import { WhaleActivityCard } from '@/components/ai/WhaleActivityCard';
import { useAIInsights } from '@/hooks/useAIInsights';
import { formatPrice } from '@/lib/format';

interface Props {
  selectedAssetId: string | null;
  onSelectAsset: (asset: CryptoAsset | null) => void;
}

export default function MarketsTab({ selectedAssetId, onSelectAsset }: Props) {
  const { assets } = useMarketData();
  const { user } = useAuth();
  const { address } = useAccount();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistDb(address, user?.id);
  const { savePrediction, saveSignal, saveWhaleActivity } = useAIInsights();
  const [q, setQ] = useState('');

  const filtered = assets.filter(
    (a) => a.symbol.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase())
  );

  const selected = selectedAssetId ? assets.find((a) => a.id === selectedAssetId) : null;

  return (
    <div className="space-y-3">
      <MarketInsightsPanel assets={assets} selectedAssetId={selectedAssetId} />

      {selected && (
        <Card className="glass-card p-3">
          <div className="flex items-center gap-2 mb-3">
            <img src={selected.logo} alt="" className="w-5 h-5 rounded-full" />
            <span className="text-sm font-semibold">{selected.symbol}</span>
            <span className="text-xs text-muted-foreground ml-auto">{formatPrice(selected.price)}</span>
          </div>
          <Tabs defaultValue="prediction" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="prediction" className="text-[11px] gap-1"><BarChart3 className="w-3 h-3" />Prediction</TabsTrigger>
              <TabsTrigger value="signal" className="text-[11px] gap-1"><Target className="w-3 h-3" />Signal</TabsTrigger>
              <TabsTrigger value="whales" className="text-[11px] gap-1"><Waves className="w-3 h-3" />Whales</TabsTrigger>
            </TabsList>
            <TabsContent value="prediction" className="mt-3">
              <MarketPredictionCard
                symbol={selected.symbol}
                name={selected.name}
                currentPrice={selected.price}
                logo={selected.logo}
                onSave={savePrediction}
              />
            </TabsContent>
            <TabsContent value="signal" className="mt-3">
              <TradingSignalCard
                symbol={selected.symbol}
                name={selected.name}
                price={selected.price}
                logo={selected.logo}
                onSave={saveSignal}
              />
            </TabsContent>
            <TabsContent value="whales" className="mt-3">
              <WhaleActivityCard
                symbol={selected.symbol}
                name={selected.name}
                price={selected.price}
                onSave={saveWhaleActivity}
              />
            </TabsContent>
          </Tabs>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search asset…" className="pl-8 h-9 text-sm" />
      </div>
      <Card className="glass-card overflow-hidden">
        <ScrollArea className="h-[480px]">
          <table className="w-full text-sm">
            <tbody>
              {filtered.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className={`border-b border-border/30 hover:bg-muted/30 cursor-pointer ${
                    selectedAssetId === asset.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <img src={asset.logo} alt="" className="w-6 h-6 rounded-full" />
                      <div>
                        <p className="font-semibold text-xs">{asset.symbol}</p>
                        <p className="text-[10px] text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono text-xs">{formatPrice(asset.price)}</td>
                  <td className="p-2 text-right">
                    <span className={`text-[11px] ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-2 hidden sm:table-cell">
                    <MiniSparkline data={asset.sparkline} positive={asset.priceChange7d >= 0} />
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (isInWatchlist(asset.id)) await removeFromWatchlist(asset.id);
                        else await addToWatchlist(asset);
                      }}
                    >
                      <Star className={`w-3 h-3 ${isInWatchlist(asset.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </Card>
    </div>
  );
}
