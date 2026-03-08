import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Sparkles,
  History,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Bell,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useMarketData } from '@/hooks/useMarketData';
import { usePortfolioDb } from '@/hooks/usePortfolioDb';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function DashboardWelcome({ userName, alertChips }: { userName: string | null; alertChips: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5 border border-primary/10 p-4 sm:p-5"
    >
      {/* Glow orb */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              {getGreeting()}{userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-xs text-muted-foreground">Your AI-powered crypto command center</p>
          </div>
        </div>
        {alertChips && <div className="mt-3">{alertChips}</div>}
      </div>
    </motion.div>
  );
}

function MarketTicker({ assets }: { assets: any[] }) {
  const top5 = assets.slice(0, 8);
  if (top5.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/30 bg-card/50">
      <div className="flex gap-0 animate-marquee-smooth whitespace-nowrap py-2 px-3">
        {[...top5, ...top5].map((a, i) => (
          <div key={`${a.id}-${i}`} className="inline-flex items-center gap-2 px-3 border-r border-border/20 last:border-0">
            <img src={a.logo} alt={a.symbol} className="w-4 h-4 rounded-full" />
            <span className="text-xs font-medium text-foreground">{a.symbol}</span>
            <span className="text-xs text-muted-foreground">${a.price < 1 ? a.price.toFixed(4) : a.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${a.priceChange24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {a.priceChange24h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(a.priceChange24h).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsCards({ portfolio, assets, alertCount, navigate }: { portfolio: any[]; assets: any[]; alertCount: number; navigate: any }) {
  const priceMap = useMemo(() => {
    const m = new Map<string, number>();
    assets.forEach(a => m.set(a.id, a.price));
    return m;
  }, [assets]);

  const totalValue = useMemo(() => {
    return portfolio.reduce((sum, p) => sum + p.amount * (priceMap.get(p.asset_id) || 0), 0);
  }, [portfolio, priceMap]);

  const totalPnL = useMemo(() => {
    return portfolio.reduce((sum, p) => {
      const current = p.amount * (priceMap.get(p.asset_id) || 0);
      const cost = p.amount * p.avg_buy_price;
      return sum + (current - cost);
    }, 0);
  }, [portfolio, priceMap]);

  const btc = assets.find(a => a.symbol === 'BTC');
  const btcChange = btc?.priceChange24h ?? 0;

  const stats = [
    {
      label: 'Portfolio Value',
      value: totalValue > 0 ? `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—',
      sub: totalPnL !== 0 ? `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}` : 'Add assets',
      subColor: totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500',
      icon: <Wallet className="w-4 h-4" />,
      accent: 'border-t-primary',
      onClick: () => navigate('/portfolio'),
    },
    {
      label: 'Market Trend',
      value: btc ? `${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(1)}%` : '—',
      sub: btcChange >= 2 ? 'Bullish' : btcChange <= -2 ? 'Bearish' : 'Neutral',
      subColor: btcChange >= 0 ? 'text-emerald-500' : 'text-red-500',
      icon: btcChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
      accent: btcChange >= 0 ? 'border-t-emerald-500' : 'border-t-red-500',
      onClick: () => navigate('/markets'),
    },
    {
      label: 'Active Alerts',
      value: alertCount > 0 ? String(alertCount) : '0',
      sub: alertCount > 0 ? 'Monitoring' : 'Set up alerts',
      subColor: 'text-muted-foreground',
      icon: <Bell className="w-4 h-4" />,
      accent: 'border-t-amber-500',
      onClick: () => navigate('/alerts'),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card
            className={`p-3 cursor-pointer hover:bg-muted/30 transition-colors border-t-2 ${s.accent}`}
            onClick={s.onClick}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              {s.icon}
              <span className="text-[10px] sm:text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-base sm:text-lg font-bold truncate">{s.value}</p>
            <p className={`text-[10px] sm:text-xs ${s.subColor} truncate`}>{s.sub}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);
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

  // Fetch user profile name
  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (profile?.name) setUserName(profile.name);
      }
    };
    fetchUserName();
  }, []);

  // Fetch active alert count
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user?.id && !address) return;
      let query = supabase.from('user_watchlist').select('id', { count: 'exact', head: true });
      if (user?.id) query = query.eq('user_id', user.id);
      else if (address) query = query.eq('wallet_address', address);
      query = query.not('alert_price', 'is', null);
      const { count } = await query;
      setAlertCount(count || 0);
    };
    fetchAlerts();
  }, [user?.id, address]);

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
      <AppHeader activePage="dashboard" rightContent={mobileHistoryButton} />

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

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Dashboard header section */}
            <div className="px-3 sm:px-4 lg:px-6 py-3 space-y-3 border-b border-border/30">
              <DashboardWelcome
                userName={userName}
                alertChips={
                  <QuickActions
                    assets={assets}
                    portfolioSymbols={portfolio.map(p => p.asset_symbol)}
                    onChatAction={(msg) => {
                      const chatInput = document.querySelector<HTMLInputElement>('input[placeholder]');
                      if (chatInput) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                        setter?.call(chatInput, msg);
                        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }}
                  />
                }
              />
              <MarketTicker assets={assets} />
              <StatsCards portfolio={portfolio} assets={assets} alertCount={alertCount} navigate={navigate} />
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatInterface
                messages={messages}
                onSaveMessage={handleSaveMessage}
                currentConversationId={currentConversationId}
                onCreateConversation={createConversation}
                setMessages={setMessages}
                hideHeader
                className="flex-1 rounded-none border-0"
              />
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
