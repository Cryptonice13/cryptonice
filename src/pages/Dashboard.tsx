import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Sparkles,
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
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
        
        if (profile?.name) {
          setUserName(profile.name);
        }
      }
    };

    fetchUserName();
  }, []);

  const handleNewChat = () => {
    startNewChat();
    setMobileHistoryOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    fetchMessages(id);
    setMobileHistoryOpen(false);
  };

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
                    currentConversationId === conv.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
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

      {/* Main Content with Sidebar */}
      <main className="flex-1 flex pt-12 pb-16 lg:pb-0">
        {/* Chat Sidebar - Hidden on mobile */}
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Welcome Header - Hidden on mobile, visible on larger screens */}
          <div className="hidden lg:block px-6 py-4 border-b border-border/50">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold truncate">
                  Welcome{userName ? `, ${userName}` : isConnected ? '' : ''}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  Your AI-powered crypto advisor
                </p>
              </div>
            </motion.div>
          </div>

          {/* Full-height Chat Interface */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatInterface
              messages={messages}
              onSaveMessage={handleSaveMessage}
              currentConversationId={currentConversationId}
              onCreateConversation={createConversation}
              setMessages={setMessages}
              className="flex-1 rounded-none border-0"
            />
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
