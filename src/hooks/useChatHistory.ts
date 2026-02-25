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

export function useChatHistory(walletAddress?: string, userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasIdentifier = !!(userId || walletAddress);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!hasIdentifier) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('wallet_address', walletAddress!);
      }

      const { data, error } = await query;
      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, userId, hasIdentifier]);

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

  // Generate a short title from user question
  const generateTitle = (content: string): string => {
    const words = content
      .replace(/[?!.,;:'"]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 5);
    
    const title = words.join(' ');
    return title.length > 40 ? title.slice(0, 40) + '...' : title || 'New Chat';
  };

  // Create a new conversation with title based on first message
  const createConversation = useCallback(async (firstMessage?: string) => {
    if (!hasIdentifier) return null;

    const title = firstMessage ? generateTitle(firstMessage) : 'New Chat';

    try {
      const insertData: Record<string, string> = { title };
      if (userId) insertData.user_id = userId;
      if (walletAddress) insertData.wallet_address = walletAddress;

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert(insertData)
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
  }, [walletAddress, userId, hasIdentifier]);

  // Save message to database only (no state update)
  const saveMessageToDb = useCallback(async (role: 'user' | 'assistant', content: string, conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({ conversation_id: conversationId, role, content });

      if (error) throw error;

      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      return true;
    } catch (err) {
      console.error('Error saving message:', err);
      return false;
    }
  }, []);

  // Add a message to a specific conversation (updates state too)
  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string, conversationId?: string) => {
    const targetConversationId = conversationId || currentConversationId;
    if (!targetConversationId) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ conversation_id: targetConversationId, role, content })
        .select()
        .single();

      if (error) throw error;
      
      setMessages(prev => [...prev, { ...data, role: data.role as 'user' | 'assistant' }]);

      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', targetConversationId);
      
      return data;
    } catch (err) {
      console.error('Error adding message:', err);
      return null;
    }
  }, [currentConversationId]);

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
    if (hasIdentifier) {
      fetchConversations();
    }
  }, [hasIdentifier, fetchConversations]);

  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    fetchConversations,
    fetchMessages,
    createConversation,
    addMessage,
    saveMessageToDb,
    updateLastAssistantMessage,
    deleteConversation,
    startNewChat,
    setMessages,
  };
}
