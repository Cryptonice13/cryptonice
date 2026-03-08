import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import {
  History,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { ChatSidebar } from '@/components/ai/ChatSidebar';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNav from '@/components/MobileBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppHeader from '@/components/AppHeader';
import { useMarketData } from '@/hooks/useMarketData';
import { usePortfolioDb } from '@/hooks/usePortfolioDb';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [dbContext, setDbContext] = useState<any>(null);
  const { assets } = useMarketData();
  const { portfolio } = usePortfolioDb(address, user?.id);

  const {
    conversations,
    currentConversationId,
    messages,
    fetchMessages,
    createConversation,
    saveMessageToDb,
    deleteConversation,
    startNewChat,
    setMessages,
  } = useChatHistory(address, user?.id);

  // Fetch all user data from DB for AI context
  const fetchDbContext = useCallback(async () => {
    const userId = user?.id;
    const wallet = address;
    if (!userId && !wallet) return;

    const buildFilter = (query: any) => {
      if (userId) return query.eq('user_id', userId);
      if (wallet) return query.eq('wallet_address', wallet);
      return query;
    };

    try {
      const [
        { data: watchlist },
        { data: strategies },
        { data: alertHistory },
        { data: predictions },
        { data: signals },
        { data: whaleActivity },
        { data: portfolioAnalysis },
        { data: transactions },
      ] = await Promise.all([
        buildFilter(supabase.from('user_watchlist').select('asset_symbol, asset_name, alert_price, alert_type, alert_triggered')).limit(20),
        buildFilter(supabase.from('strategies').select('strategy_name, strategy_type, asset_symbol, signal, risk_level, entry_price, stop_loss, status, confidence')).limit(20),
        buildFilter(supabase.from('alert_history').select('asset_symbol, alert_type, target_price, triggered_price, triggered_at, is_read')).order('triggered_at', { ascending: false }).limit(10),
        buildFilter(supabase.from('ai_predictions' as any).select('asset_symbol, current_price, prediction_data, created_at')).order('created_at', { ascending: false }).limit(5),
        buildFilter(supabase.from('ai_signals' as any).select('asset_symbol, current_price, signal_data, created_at')).order('created_at', { ascending: false }).limit(5),
        buildFilter(supabase.from('ai_whale_activity' as any).select('asset_symbol, whale_data, created_at')).order('created_at', { ascending: false }).limit(5),
        buildFilter(supabase.from('ai_portfolio_analysis' as any).select('health_score, risk_level, diversification, analysis_data, created_at')).order('created_at', { ascending: false }).limit(3),
        buildFilter(supabase.from('portfolio_transactions').select('asset_symbol, transaction_type, amount, price_per_unit, total_value, created_at')).order('created_at', { ascending: false }).limit(15),
      ]);

      setDbContext({
        portfolio: portfolio.map(p => ({
          symbol: p.asset_symbol,
          name: p.asset_name,
          amount: p.amount,
          avgBuyPrice: p.avg_buy_price,
          currentPrice: assets.find(a => a.id === p.asset_id)?.price || 0,
        })),
        watchlist: watchlist || [],
        strategies: strategies || [],
        alertHistory: alertHistory || [],
        recentPredictions: predictions || [],
        recentSignals: signals || [],
        recentWhaleActivity: whaleActivity || [],
        portfolioAnalysis: portfolioAnalysis || [],
        recentTransactions: transactions || [],
      });
    } catch (err) {
      console.error('Failed to fetch DB context for AI:', err);
    }
  }, [user?.id, address, portfolio, assets]);

  useEffect(() => {
    fetchDbContext();
  }, [fetchDbContext]);

  const handleNewChat = () => { startNewChat(); setMobileHistoryOpen(false); };
  const handleSelectConversation = (id: string) => { fetchMessages(id); setMobileHistoryOpen(false); };
  const handleSaveMessage = async (role: 'user' | 'assistant', content: string, conversationId: string) => {
    return await saveMessageToDb(role, content, conversationId);
  };

  const mobileHistoryButton = (
    <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
          <History className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] max-w-sm p-0">
        <SheetHeader className="p-4 border-b border-border/50">
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>
        <div className="p-3">
          <Button onClick={handleNewChat} className="w-full button-gradient">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-3 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentConversationId === conv.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <AppHeader activePage="dashboard" rightContent={mobileHistoryButton} />

      <main className="flex-1 flex pt-12 pb-16 lg:pb-0 overflow-hidden">
        {/* Chat Sidebar - Desktop only */}
        <div className="hidden lg:block h-full">
          <ChatSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={deleteConversation}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Chat - Full viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <ChatInterface
            messages={messages}
            onSaveMessage={handleSaveMessage}
            currentConversationId={currentConversationId}
            onCreateConversation={createConversation}
            setMessages={setMessages}
            portfolioContext={dbContext}
            hideHeader
            className="flex-1 rounded-none border-0"
          />
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
