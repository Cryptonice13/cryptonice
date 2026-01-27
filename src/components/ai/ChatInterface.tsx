import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

// Strip markdown formatting for clean display
const stripMarkdown = (text: string): string => {
  return text
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Bold italic
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/__(.+?)__/g, '$1') // Bold underscore
    .replace(/_(.+?)_/g, '$1') // Italic underscore
    .replace(/~~(.+?)~~/g, '$1') // Strikethrough
    .replace(/`{3}[\s\S]*?`{3}/g, '') // Code blocks
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/^\s*[-*+]\s+/gm, '• ') // Bullet points
    .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/^---+$/gm, '') // Horizontal rules
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim();
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  messages?: Message[];
  onSaveMessage?: (role: 'user' | 'assistant', content: string, conversationId: string) => Promise<boolean>;
  currentConversationId?: string | null;
  onCreateConversation?: (firstMessage?: string) => Promise<{ id: string } | null>;
  setMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  portfolioContext?: any;
  className?: string;
}

const CHAT_URL = `https://ttqhdfxzrajwgpbkkhjj.supabase.co/functions/v1/crypto-ai`;

export function ChatInterface({ 
  messages: externalMessages, 
  onSaveMessage,
  currentConversationId,
  onCreateConversation,
  setMessages: setExternalMessages,
  portfolioContext, 
  className = '' 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use external messages if provided, otherwise use internal state
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
    
    // If we have external state management, create conversation if needed
    if (hasExternalState) {
      if (!currentConversationId) {
        // Create conversation with the first message as the title
        const newConv = await onCreateConversation(messageContent);
        if (!newConv) return;
        activeConversationId = newConv.id;
      }
    }
    
    // Update messages state (only once - here for UI, database save happens separately)
    setMessages((prev: Message[]) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0cWhkZnh6cmFqd2dwYmtraGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjAwMjgsImV4cCI6MjA2OTAzNjAyOH0.ZB4PiYMnNSGPcK3Pe3Z_LStE_MQGeVFiL6ZyXgwukkY`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          type: 'chat',
          context: portfolioContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages((prev: Message[]) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: 'assistant' as const, content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Save both messages to database if we have the callback (don't update state, already done)
      if (hasExternalState && activeConversationId) {
        // Save user message
        await onSaveMessage('user', messageContent, activeConversationId);
        // Save assistant message
        if (assistantContent) {
          await onSaveMessage('assistant', assistantContent, activeConversationId);
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

  const suggestedQuestions = [
    "What's your outlook on Bitcoin this week?",
    "Analyze my portfolio for risks",
    "Best DeFi tokens to watch?",
    "Should I buy ETH now?",
  ];

  return (
    <Card className={`glass-card flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">CryptoAI Advisor</h3>
            <p className="text-xs text-muted-foreground">Powered by AI</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearMessages}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Welcome to CryptoAI</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask me anything about crypto markets, portfolio analysis, or trading strategies.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {suggestedQuestions.map((question, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs text-left h-auto py-2 px-3"
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {msg.role === 'assistant' ? stripMarkdown(msg.content) : msg.content}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted/50 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="text-center p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about crypto markets..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="button-gradient">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
