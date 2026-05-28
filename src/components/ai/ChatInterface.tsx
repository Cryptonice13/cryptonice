import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, BarChart3, Zap, TrendingUp, Shield, History, Plus, Briefcase, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { AgentToolCard, type ToolCall } from './AgentToolCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

interface ChatInterfaceProps {
  messages?: Message[];
  onSaveMessage?: (role: 'user' | 'assistant', content: string, conversationId: string) => Promise<boolean>;
  currentConversationId?: string | null;
  onCreateConversation?: (firstMessage?: string) => Promise<{ id: string } | null>;
  setMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  portfolioContext?: any;
  className?: string;
  hideHeader?: boolean;
  onOpenHistory?: () => void;
  onNewChat?: () => void;
}

const CHAT_URL = `https://ttqhdfxzrajwgpbkkhjj.supabase.co/functions/v1/crypto-ai`;

export function ChatInterface({ 
  messages: externalMessages, 
  onSaveMessage,
  currentConversationId,
  onCreateConversation,
  setMessages: setExternalMessages,
  portfolioContext, 
  className = '',
  hideHeader = false,
  onOpenHistory,
  onNewChat,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getRelativeTime = (date: Date | null) => {
    if (!date) return null;
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const [, setTimeUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTimeUpdate(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const messages = externalMessages || internalMessages;
  const setMessages = setExternalMessages || setInternalMessages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const sendMessage = async (messageContent: string) => {
    const userMsg: Message = { role: 'user', content: messageContent };
    let activeConversationId = currentConversationId;
    const hasExternalState = onSaveMessage && onCreateConversation;

    if (hasExternalState) {
      if (!currentConversationId) {
        const newConv = await onCreateConversation(messageContent);
        if (!newConv) return;
        activeConversationId = newConv.id;
      }
    }

    setMessages((prev: Message[]) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0cWhkZnh6cmFqd2dwYmtraGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjAwMjgsImV4cCI6MjA2OTAzNjAyOH0.ZB4PiYMnNSGPcK3Pe3Z_LStE_MQGeVFiL6ZyXgwukkY`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          type: 'agent_chat',
          context: portfolioContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      const assistantContent: string = data.content || '';
      const toolCalls: ToolCall[] = Array.isArray(data.toolCalls) ? data.toolCalls : [];

      const assistantMsg: Message = { role: 'assistant', content: assistantContent, toolCalls };
      setMessages((prev: Message[]) => [...prev, assistantMsg]);
      setLastDataUpdate(new Date());

      window.dispatchEvent(new CustomEvent('credits-updated'));

      if (hasExternalState && activeConversationId) {
        await onSaveMessage('user', messageContent, activeConversationId);
        if (assistantContent) {
          // Persist tool results inline as JSON fenced block so reload restores them
          const payload = toolCalls.length
            ? `${assistantContent}\n\n<!--tools:${JSON.stringify(toolCalls)}-->`
            : assistantContent;
          await onSaveMessage('assistant', payload, activeConversationId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };
  const suggestedPrompts = [
    { icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, label: 'Predict BTC', desc: 'Short & medium-term outlook' },
    { icon: <Target className="w-4 h-4 text-blue-500" />, label: 'Give me a signal for SOL', desc: 'Entry, SL, TP levels' },
    { icon: <BarChart3 className="w-4 h-4 text-purple-500" />, label: 'TA on ETH', desc: 'RSI, MACD, trend' },
    { icon: <Briefcase className="w-4 h-4 text-amber-500" />, label: 'Review my portfolio', desc: 'Risk & allocation' },
  ];


  return (
    <Card className={`glass-card flex flex-col h-full overflow-hidden ${className}`}>
      {/* Header - conditionally hidden */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">CryptoAI Advisor</h3>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                  <span className="relative flex h-1 w-1 sm:h-1.5 sm:w-1.5 mr-0.5 sm:mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
                  </span>
                  Live
                </Badge>
                {lastDataUpdate && (
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden xs:inline">
                    {getRelativeTime(lastDataUpdate)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onOpenHistory && (
              <Button variant="ghost" size="sm" onClick={onOpenHistory} className="lg:hidden h-7 w-7 sm:h-8 sm:w-8 p-0" title="Chat history">
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
            {onNewChat && (
              <Button variant="ghost" size="sm" onClick={onNewChat} className="lg:hidden h-7 w-7 sm:h-8 sm:w-8 p-0" title="New chat">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearMessages} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Compact inline status when header is hidden */}
      {hideHeader && messages.length > 0 && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              <span className="relative flex h-1 w-1 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
              </span>
              Live
            </Badge>
            {lastDataUpdate && (
              <span className="text-[9px] text-muted-foreground">{getRelativeTime(lastDataUpdate)}</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearMessages} className="h-7 w-7 p-0">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-6 sm:py-10 space-y-4 sm:space-y-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm sm:text-base">Your AI Trading Agent</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 px-4">
                  Ask for predictions, signals, technical analysis, or trade ideas — I'll run the right tools for you.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto px-2">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full text-left h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-muted/50 hover:border-primary/30 transition-colors"
                      onClick={() => sendMessage(prompt.label)}
                    >
                      <div className="flex items-center gap-2">
                        {prompt.icon}
                        <span className="text-xs font-semibold">{prompt.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{prompt.desc}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                // Restore tool calls from persisted marker if present
                let displayContent = msg.content;
                let toolCalls = msg.toolCalls;
                if (msg.role === 'assistant' && !toolCalls && typeof msg.content === 'string') {
                  const m = msg.content.match(/<!--tools:(.+?)-->\s*$/s);
                  if (m) {
                    try { toolCalls = JSON.parse(m[1]) as ToolCall[]; } catch { /* noop */ }
                    displayContent = msg.content.replace(/<!--tools:.+?-->\s*$/s, '').trim();
                  }
                }
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[80%] space-y-2 ${msg.role === 'user' ? '' : 'flex-1 min-w-0'}`}>
                      {msg.role === 'assistant' && toolCalls && toolCalls.length > 0 && (
                        <div className="space-y-1.5">
                          {toolCalls.map((tc, j) => <AgentToolCard key={j} call={tc} />)}
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm prose-invert max-w-none text-xs sm:text-sm leading-relaxed [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_ol]:mb-1.5 [&_li]:mb-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1 [&_code]:bg-secondary [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:p-2 [&_pre]:rounded-lg [&_strong]:text-foreground [&_a]:text-primary">
                            <ReactMarkdown>{displayContent}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 sm:gap-3"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted/50 rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="text-center p-3 sm:p-4 rounded-lg bg-destructive/10 text-destructive text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-border/50 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about crypto..."
            disabled={isLoading}
            className="flex-1 h-10 sm:h-11 text-sm"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="button-gradient h-10 w-10 sm:h-11 sm:w-11 p-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
