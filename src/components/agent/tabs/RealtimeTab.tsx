import { RealtimePanel } from '@/components/markets/realtime/RealtimePanel';
import { useMarketData } from '@/hooks/useMarketData';

export default function RealtimeTab({ initialAssetId }: { initialAssetId?: string | null }) {
  const { assets } = useMarketData();
  return <RealtimePanel assets={assets} initialAssetId={initialAssetId} />;
}
