import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  Bot,
  Wallet,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { ChatSidebar } from '@/components/ai/ChatSidebar';
import { useChatHistory } from '@/hooks/useChatHistory';
import MobileBottomNav from '@/components/MobileBottomNav';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

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
  } = useChatHistory(address);

  // Fetch user profile name
  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.name) {
          setUserName(profile.name);
        }
      }
    };

    fetchUserName();
  }, []);

  const handleConnect = async () => {
    try {
      connect({ connector: injected() });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleNewChat = () => {
    startNewChat();
  };

  const handleSelectConversation = (id: string) => {
    fetchMessages(id);
  };

  const handleSaveMessage = async (role: 'user' | 'assistant', content: string, conversationId: string) => {
    return await saveMessageToDb(role, content, conversationId);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">CryptoAI</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-primary">Dashboard</Link>
            <Link to="/portfolio" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
            <Link to="/markets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Markets</Link>
            <Link to="/alerts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Alerts</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Profile Icon */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              className="hidden sm:flex"
            >
              <User className="w-5 h-5" />
            </Button>

            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Wallet className="w-4 h-4" />
                    <span className="hidden sm:inline">{formatAddress(address!)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => disconnect()} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleConnect} className="button-gradient">
                <Wallet className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50"
          >
            <nav className="container mx-auto px-4 py-4 space-y-2">
              <Link to="/dashboard" className="block py-2 text-primary font-medium">Dashboard</Link>
              <Link to="/portfolio" className="block py-2 text-muted-foreground">Portfolio</Link>
              <Link to="/markets" className="block py-2 text-muted-foreground">Markets</Link>
              <Link to="/alerts" className="block py-2 text-muted-foreground">Alerts</Link>
              {isConnected && (
                <>
                  <Link to="/profile" className="block py-2 text-muted-foreground">Profile</Link>
                  <Link to="/settings" className="block py-2 text-muted-foreground">Settings</Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </header>

      {/* Main Content with Sidebar */}
      <main className="flex-1 flex pt-16 pb-20 md:pb-0">
        {/* Chat Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Welcome Header */}
          <div className="p-4 md:p-6 border-b border-border/50">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  Welcome{userName ? `, ${userName}` : isConnected ? '' : ''}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your AI-powered crypto advisor is ready to help you make smarter decisions.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Full-height Chat Interface */}
          <div className="flex-1 p-4 md:p-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <ChatInterface
                messages={messages}
                onSaveMessage={handleSaveMessage}
                currentConversationId={currentConversationId}
                onCreateConversation={createConversation}
                setMessages={setMessages}
              />
            </motion.div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
