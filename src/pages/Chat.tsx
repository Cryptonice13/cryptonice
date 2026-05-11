import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { History, Plus, PanelRight, LineChart, Cpu, Trophy, Radio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import AgentWorkspace from '@/components/agent/AgentWorkspace';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useAuth } from '@/hooks/useAuth';
import { useMarketData, type CryptoAsset } from '@/hooks/useMarketData';
import { usePortfolioDb } from '@/hooks/usePortfolioDb';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';

const VALID_TABS = ['markets', 'strategy', 'signals', 'realtime'] as const;

export default function Chat() {
  const { user } = useAuth();
  const { address } = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (VALID_TABS as readonly string[]).includes(searchParams.get('tab') || '')
    ? (searchParams.get('tab') as string)
    : 'markets';
  const [workspaceTab, setWorkspaceTab] = useState<string>(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mobileWorkspaceOpen, setMobileWorkspaceOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);

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

  // Sync tab to URL
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', workspaceTab);
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceTab]);

  // Build rich context from all DB tables for accurate AI analysis
  const [dbContext, setDbContext] = useState<any>(null);

  useEffect(() => {
    const fetchAllContext = async () => {
      if (!user?.id && !address) return;
      const col = user?.id ? 'user_id' : 'wallet_address';
      const val = user?.id || address!;

      const [watchlistRes, strategiesRes, alertHistoryRes, predictionsRes, signalsRes, whaleRes, portfolioAnalysisRes, transactionsRes] = await Promise.all([
        supabase.from('user_watchlist').select('*').eq(col, val).limit(50),
        supabase.from('strategies').select('*').eq(col, val).limit(20),
        supabase.from('alert_history').select('*').eq(col, val).order('triggered_at', { ascending: false }).limit(20),
        supabase.from('ai_predictions').select('*').eq(col, val).order('created_at', { ascending: false }).limit(10),
        supabase.from('ai_signals').select('*').eq(col, val).order('created_at', { ascending: false }).limit(10),
        supabase.from('ai_whale_activity').select('*').eq(col, val).order('created_at', { ascending: false }).limit(10),
        supabase.from('ai_portfolio_analysis').select('*').eq(col, val).order('created_at', { ascending: false }).limit(5),
        supabase.from('portfolio_transactions').select('*').eq(col, val).order('created_at', { ascending: false }).limit(30),
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
        marketData: assets.slice(0, 20).map((a) => ({
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

  const enrichedContext = useMemo(
    () => ({
      ...(dbContext || {}),
      activeAsset: selectedAsset
        ? {
            id: selectedAsset.id,
            symbol: selectedAsset.symbol,
            name: selectedAsset.name,
            price: selectedAsset.price,
            change24h: selectedAsset.priceChange24h,
          }
        : null,
    }),
    [dbContext, selectedAsset],
  );

  const handleNewChat = () => { startNewChat(); setMobileHistoryOpen(false); };
  const handleSelectConversation = (id: string) => { fetchMessages(id); setMobileHistoryOpen(false); };
  const handleSaveMessage = async (role: 'user' | 'assistant', content: string, conversationId: string) => {
    return await saveMessageToDb(role, content, conversationId);
  };

  // Inject strategy results into chat as assistant message
  const handleStrategyResult = async (markdown: string) => {
    setMessages((prev: any[]) => [...prev, { role: 'assistant', content: markdown }]);
    let convId = currentConversationId;
    if (!convId) {
      const conv = await createConversation('Strategy result');
      if (conv) convId = conv.id;
    }
    if (convId) await saveMessageToDb('assistant', markdown, convId);
  };

  const headerRight = (
    <>
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

      <Sheet open={mobileWorkspaceOpen} onOpenChange={setMobileWorkspaceOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
            <PanelRight className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[95%] sm:w-[480px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-border/50">
            <SheetTitle>Agent Workspace</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <AgentWorkspace
              tab={workspaceTab}
              onTabChange={setWorkspaceTab}
              selectedAssetId={selectedAsset?.id || null}
              onSelectAsset={setSelectedAsset}
              onStrategyResult={handleStrategyResult}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex h-8 w-8"
        onClick={() => setWorkspaceOpen((v) => !v)}
        title={workspaceOpen ? 'Hide workspace' : 'Show workspace'}
      >
        <PanelRight className="w-4 h-4" />
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader rightContent={headerRight} />

      <main className="flex-1 flex flex-col pt-12 pb-16 lg:pb-0">
        <div className="flex-1 flex">
          {/* Left: Conversations */}
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

          {/* Center: Chat */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedAsset && (
              <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-muted/20">
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <img src={selectedAsset.logo} alt="" className="w-3.5 h-3.5 rounded-full" />
                  Context: {selectedAsset.symbol}
                </Badge>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedAsset(null)}>
                  <X className="w-3 h-3" />
                </Button>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  Sent with each message to the agent
                </span>
              </div>
            )}
            <ChatInterface
              messages={messages}
              onSaveMessage={handleSaveMessage}
              currentConversationId={currentConversationId}
              onCreateConversation={createConversation}
              setMessages={setMessages}
              portfolioContext={enrichedContext}
              hideHeader={false}
              className="flex-1 rounded-none border-0"
            />
          </div>

          {/* Right: Agent Workspace (desktop) */}
          {workspaceOpen && (
            <aside className="hidden lg:flex flex-col w-[420px] xl:w-[480px] h-[calc(100vh-48px)] sticky top-12 border-l border-border/50 bg-background">
              <AgentWorkspace
                tab={workspaceTab}
                onTabChange={setWorkspaceTab}
                selectedAssetId={selectedAsset?.id || null}
                onSelectAsset={setSelectedAsset}
                onStrategyResult={handleStrategyResult}
              />
            </aside>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
