import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cpu, Sparkles, TrendingUp, LayoutDashboard } from 'lucide-react';
import OverviewTab from '@/components/auto-trader/tabs/OverviewTab';
import StrategiesTab from '@/components/auto-trader/tabs/StrategiesTab';
import BacktestTab from '@/components/auto-trader/tabs/BacktestTab';
import type { TradingStrategy } from '@/hooks/useStrategies';

export default function AutoTrader() {
  const [tab, setTab] = useState('overview');
  const [backtestTarget, setBacktestTarget] = useState<TradingStrategy | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 pt-14 pb-20 lg:pb-6 px-3 sm:px-4 max-w-4xl w-full mx-auto">
        <div className="mb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Auto Trader</h1>
            <p className="text-xs text-muted-foreground">AI-driven strategy creation, backtesting & (soon) paper execution.</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full h-9">
            <TabsTrigger value="overview" className="text-xs gap-1"><LayoutDashboard className="w-3.5 h-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="strategies" className="text-xs gap-1"><Sparkles className="w-3.5 h-3.5" />Strategies</TabsTrigger>
            <TabsTrigger value="backtest" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" />Backtest</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
            <TabsContent value="strategies" className="mt-0">
              <StrategiesTab onBacktest={(s) => { setBacktestTarget(s); setTab('backtest'); }} />
            </TabsContent>
            <TabsContent value="backtest" className="mt-0">
              <BacktestTab initialStrategy={backtestTarget} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <MobileBottomNav />
    </div>
  );
}
