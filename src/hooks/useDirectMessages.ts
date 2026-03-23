import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  friendId: string;
  friendName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export function useDirectMessages(activeFriendId?: string) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchConversations = useCallback(async (friendsList: { friendId: string; friendName: string }[]) => {
    if (!user || friendsList.length === 0) {
      setConversations([]);
      return;
    }

    const convos: Conversation[] = [];

    for (const friend of friendsList) {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${friend.friendId}),and(sender_id.eq.${friend.friendId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', friend.friendId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      convos.push({
        friendId: friend.friendId,
        friendName: friend.friendName,
        lastMessage: data?.[0]?.content,
        lastMessageAt: data?.[0]?.created_at,
        unreadCount: count || 0,
      });
    }

    // Sort by last message time
    convos.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    setConversations(convos);
  }, [user]);

  const fetchMessages = useCallback(async (friendId: string) => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching messages:', error);
    }

    setMessages((data as DirectMessage[]) || []);
    setLoading(false);

    // Mark unread messages as read
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !activeFriendId) return;

    fetchMessages(activeFriendId);

    const channel = supabase
      .channel(`dm-${user.id}-${activeFriendId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage;
          if (newMsg.sender_id === activeFriendId) {
            setMessages(prev => [...prev, newMsg]);
            // Mark as read
            supabase
              .from('direct_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user, activeFriendId, fetchMessages]);

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user || !content.trim()) return;

    const { data, error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    }).select().single();

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setMessages(prev => [...prev, data as DirectMessage]);
  };

  return { conversations, messages, loading, fetchConversations, fetchMessages, sendMessage };
}
