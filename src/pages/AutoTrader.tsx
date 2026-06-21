import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cpu, Sparkles, TrendingUp, LayoutDashboard, Play, PieChart, Zap, BookOpen } from 'lucide-react';
import OverviewTab from '@/components/auto-trader/tabs/OverviewTab';
import StrategiesTab from '@/components/auto-trader/tabs/StrategiesTab';
import BacktestTab from '@/components/auto-trader/tabs/BacktestTab';
import PaperTradingTab from '@/components/auto-trader/tabs/PaperTradingTab';
import PortfolioOptimizerTab from '@/components/auto-trader/tabs/PortfolioOptimizerTab';
import ArbitrageTab from '@/components/auto-trader/tabs/ArbitrageTab';
import JournalTab from '@/components/auto-trader/tabs/JournalTab';
import type { TradingStrategy } from '@/hooks/useStrategies';

const VALID_TABS = ['overview', 'strategies', 'backtest', 'paper', 'portfolio', 'arbitrage', 'journal'];

export default function AutoTrader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState(initialTab && VALID_TABS.includes(initialTab) ? initialTab : 'overview');
  const [backtestTarget, setBacktestTarget] = useState<TradingStrategy | null>(null);
  const highlightStrategyId = searchParams.get('strategyId');

  // Sync URL ↔ state when the user clicks tabs
  useEffect(() => {
    const current = searchParams.get('tab');
    if (current !== tab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', tab);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Respond to back/forward navigation
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== tab) {
      setTab(urlTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 pt-14 pb-20 lg:pb-6 px-3 sm:px-4 max-w-4xl w-full mx-auto">
        <div className="mb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Auto Trader</h1>
            <p className="text-xs text-muted-foreground">AI strategies, backtesting, paper trading, optimization & arbitrage.</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max h-9 gap-1">
              <TabsTrigger value="overview" className="text-xs gap-1"><LayoutDashboard className="w-3.5 h-3.5" />Overview</TabsTrigger>
              <TabsTrigger value="strategies" className="text-xs gap-1"><Sparkles className="w-3.5 h-3.5" />Strategies</TabsTrigger>
              <TabsTrigger value="backtest" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" />Backtest</TabsTrigger>
              <TabsTrigger value="paper" className="text-xs gap-1"><Play className="w-3.5 h-3.5" />Paper</TabsTrigger>
              <TabsTrigger value="portfolio" className="text-xs gap-1"><PieChart className="w-3.5 h-3.5" />Optimizer</TabsTrigger>
              <TabsTrigger value="arbitrage" className="text-xs gap-1"><Zap className="w-3.5 h-3.5" />Arbitrage</TabsTrigger>
              <TabsTrigger value="journal" className="text-xs gap-1"><BookOpen className="w-3.5 h-3.5" />Journal</TabsTrigger>
            </TabsList>
          </div>
          <div className="mt-4">
            <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
            <TabsContent value="strategies" className="mt-0">
              <StrategiesTab onBacktest={(s) => { setBacktestTarget(s); setTab('backtest'); }} highlightId={highlightStrategyId} />
            </TabsContent>
            <TabsContent value="backtest" className="mt-0"><BacktestTab initialStrategy={backtestTarget} /></TabsContent>
            <TabsContent value="paper" className="mt-0"><PaperTradingTab /></TabsContent>
            <TabsContent value="portfolio" className="mt-0"><PortfolioOptimizerTab /></TabsContent>
            <TabsContent value="arbitrage" className="mt-0"><ArbitrageTab /></TabsContent>
            <TabsContent value="journal" className="mt-0"><JournalTab /></TabsContent>
          </div>
        </Tabs>
      </main>
      <MobileBottomNav />
    </div>
  );
}
