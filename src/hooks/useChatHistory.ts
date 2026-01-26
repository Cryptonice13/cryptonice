import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function useChatHistory(walletAddress?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(m => ({ ...m, role: m.role as 'user' | 'assistant' })));
      setCurrentConversationId(conversationId);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (title: string = 'New Chat') => {
    if (!walletAddress) return null;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          wallet_address: walletAddress,
          title,
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversations(prev => [data, ...prev]);
      setCurrentConversationId(data.id);
      setMessages([]);
      
      return data;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return null;
    }
  }, [walletAddress]);

  // Add a message to the current conversation
  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!currentConversationId) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversationId,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      
      setMessages(prev => [...prev, { ...data, role: data.role as 'user' | 'assistant' }]);

      // Update conversation title if it's the first user message
      if (role === 'user' && messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await supabase
          .from('chat_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', currentConversationId);
        
        setConversations(prev => 
          prev.map(c => c.id === currentConversationId ? { ...c, title } : c)
        );
      } else {
        // Just update the timestamp
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentConversationId);
      }
      
      return data;
    } catch (err) {
      console.error('Error adding message:', err);
      return null;
    }
  }, [currentConversationId, messages.length]);

  // Update the last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback(async (content: string) => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    
    if (lastAssistantMessage) {
      try {
        await supabase
          .from('chat_messages')
          .update({ content })
          .eq('id', lastAssistantMessage.id);
        
        setMessages(prev => 
          prev.map(m => m.id === lastAssistantMessage.id ? { ...m, content, role: m.role as 'user' | 'assistant' } : m)
        );
      } catch (err) {
        console.error('Error updating message:', err);
      }
    }
  }, [messages]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  }, [currentConversationId]);

  // Clear current chat and start fresh
  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (walletAddress) {
      fetchConversations();
    }
  }, [walletAddress, fetchConversations]);

  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    fetchConversations,
    fetchMessages,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    deleteConversation,
    startNewChat,
    setMessages,
  };
}
