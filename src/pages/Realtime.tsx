import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { RealtimePanel } from '@/components/markets/realtime/RealtimePanel';
import { useMarketData } from '@/hooks/useMarketData';

export default function Realtime() {
  const { assets } = useMarketData();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 pt-14 pb-20 lg:pb-6 px-3 sm:px-4 max-w-7xl w-full mx-auto">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Realtime Markets</h1>
          <p className="text-xs text-muted-foreground">Live multi-exchange data, order books, trades & arbitrage.</p>
        </div>
        <RealtimePanel assets={assets} />
      </main>
      <MobileBottomNav />
    </div>
  );
}
