import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { ChatSidebar } from '@/components/ai/ChatSidebar';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useAuth } from '@/hooks/useAuth';
import { useMarketData } from '@/hooks/useMarketData';
import { usePortfolioDb } from '@/hooks/usePortfolioDb';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function Chat() {
  const { user } = useAuth();
  const { address } = useAccount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
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

  // Build rich context from all DB tables for accurate AI analysis
  const [dbContext, setDbContext] = useState<any>(null);

  useEffect(() => {
    const fetchAllContext = async () => {
      if (!user?.id && !address) return;

      const identifier = user?.id
        ? { key: 'user_id', value: user.id }
        : { key: 'wallet_address', value: address! };

      const [
        watchlistRes,
        strategiesRes,
        alertHistoryRes,
        predictionsRes,
        signalsRes,
        whaleRes,
        portfolioAnalysisRes,
        transactionsRes,
      ] = await Promise.all([
        supabase.from('user_watchlist').select('*').eq(identifier.key, identifier.value).limit(50),
        supabase.from('strategies').select('*').eq(identifier.key, identifier.value).limit(20),
        supabase.from('alert_history').select('*').eq(identifier.key, identifier.value).order('triggered_at', { ascending: false }).limit(20),
        supabase.from('ai_predictions').select('*').eq(identifier.key, identifier.value).order('created_at', { ascending: false }).limit(10),
        supabase.from('ai_signals').select('*').eq(identifier.key, identifier.value).order('created_at', { ascending: false }).limit(10),
        supabase.from('ai_whale_activity').select('*').eq(identifier.key, identifier.value).order('created_at', { ascending: false }).limit(10),
        supabase.from('ai_portfolio_analysis').select('*').eq(identifier.key, identifier.value).order('created_at', { ascending: false }).limit(5),
        supabase.from('portfolio_transactions').select('*').eq(identifier.key, identifier.value).order('created_at', { ascending: false }).limit(30),
      ]);

      setDbContext({
        portfolio: portfolio || [],
        watchlist: watchlistRes.data || [],
        strategies: strategiesRes.data || [],
        alertHistory: alertHistoryRes.data || [],
        aiPredictions: predictionsRes.data || [],
        aiSignals: signalsRes.data || [],
        whaleActivity: whaleRes.data || [],
        portfolioAnalysis: portfolioAnalysisRes.data || [],
        transactions: transactionsRes.data || [],
        marketData: assets.slice(0, 20).map(a => ({
          symbol: a.symbol,
          name: a.name,
          price: a.price,
          change24h: a.priceChange24h,
          marketCap: a.marketCap,
        })),
      });
    };

    fetchAllContext();
  }, [user?.id, address, portfolio, assets]);

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
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader rightContent={mobileHistoryButton} />

      <main className="flex-1 flex flex-col pt-12 pb-16 lg:pb-0">
        <div className="flex-1 flex">
          {/* Chat Sidebar - Desktop only */}
          <div className="hidden lg:block h-[calc(100vh-48px)] sticky top-12">
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

          {/* Full-view chat */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ChatInterface
              messages={messages}
              onSaveMessage={handleSaveMessage}
              currentConversationId={currentConversationId}
              onCreateConversation={createConversation}
              setMessages={setMessages}
              portfolioContext={dbContext}
              hideHeader={false}
              className="flex-1 rounded-none border-0"
            />
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
