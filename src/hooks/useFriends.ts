import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  friend_name?: string;
  friend_email?: string;
}

export function useFriends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pending, setPending] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friends:', error);
      setLoading(false);
      return;
    }

    const friendships = (data || []) as Friendship[];

    // Get friend profiles
    const friendIds = friendships.map(f =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    let profilesMap: Record<string, { name: string }> = {};
    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .rpc('get_public_profiles', { _ids: friendIds });

      if (profiles) {
        (profiles as any[]).forEach((p) => {
          profilesMap[p.user_id] = { name: p.name || 'User' };
        });
      }
    }

    const enriched = friendships.map(f => {
      const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      const profile = profilesMap[friendId];
      return {
        ...f,
        friend_name: profile?.name || 'User',
        friend_email: '',
      };
    });

    setFriends(enriched.filter(f => f.status === 'accepted'));
    setPending(enriched.filter(f => f.status === 'pending'));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, email')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('user_id', user.id)
      .limit(10);

    if (error) {
      console.error('Search error:', error);
      return [];
    }
    return data || [];
  };

  const sendRequest = async (addresseeId: string) => {
    if (!user) return;

    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already sent', description: 'Friend request already exists.' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Request sent!' });
    fetchFriends();
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Friend added!' });
    fetchFriends();
  };

  const rejectRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    fetchFriends();
  };

  return { friends, pending, loading, searchUsers, sendRequest, acceptRequest, rejectRequest, refetch: fetchFriends };
}
