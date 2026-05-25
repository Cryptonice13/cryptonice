import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Cpu, Radio } from 'lucide-react';
import MarketsTab from './tabs/MarketsTab';
import StrategyTab from './tabs/StrategyTab';
import RealtimeTab from './tabs/RealtimeTab';
import type { CryptoAsset } from '@/hooks/useMarketData';

interface Props {
  tab: string;
  onTabChange: (t: string) => void;
  selectedAssetId: string | null;
  onSelectAsset: (asset: CryptoAsset | null) => void;
  onStrategyResult?: (markdown: string) => void;
}

export default function AgentWorkspace({
  tab,
  onTabChange,
  selectedAssetId,
  onSelectAsset,
  onStrategyResult,
}: Props) {
  // Guard: if a removed tab (e.g. "signals") was persisted, fall back to markets
  const safeTab = tab === 'signals' ? 'markets' : tab;
  return (
    <div className="h-full flex flex-col">
      <Tabs value={safeTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-3 h-9 mx-3 mt-3" style={{ width: 'calc(100% - 1.5rem)' }}>
          <TabsTrigger value="markets" className="text-xs gap-1"><LineChart className="w-3.5 h-3.5" />Markets</TabsTrigger>
          <TabsTrigger value="strategy" className="text-xs gap-1"><Cpu className="w-3.5 h-3.5" />Strategy</TabsTrigger>
          <TabsTrigger value="realtime" className="text-xs gap-1"><Radio className="w-3.5 h-3.5" />Realtime</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto p-3">
          <TabsContent value="markets" className="mt-0">
            <MarketsTab selectedAssetId={selectedAssetId} onSelectAsset={onSelectAsset} />
          </TabsContent>
          <TabsContent value="strategy" className="mt-0">
            <StrategyTab onResult={onStrategyResult} />
          </TabsContent>
          <TabsContent value="realtime" className="mt-0">
            <RealtimeTab initialAssetId={selectedAssetId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
