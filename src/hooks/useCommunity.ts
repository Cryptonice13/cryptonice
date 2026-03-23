import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CommunityPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  image_url: string | null;
  post_type: string;
  asset_symbol: string | null;
  signal: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  liked_by_me?: boolean;
}

export interface CommunityComment {
  id: string;
  user_id: string;
  post_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export function useCommunity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data: postsData, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      return;
    }

    if (!user || !postsData) {
      setPosts((postsData as CommunityPost[]) || []);
      setLoading(false);
      return;
    }

    // Check which posts the current user has liked
    const { data: likes } = await supabase
      .from('community_likes')
      .select('post_id')
      .eq('user_id', user.id);

    const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
    
    setPosts(
      (postsData as CommunityPost[]).map(p => ({
        ...p,
        liked_by_me: likedPostIds.has(p.id),
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (
    content: string,
    imageFile?: File | null,
    postType: string = 'general',
    assetSymbol?: string,
    signal?: string
  ) => {
    if (!user) return;

    let imageUrl: string | null = null;

    if (imageFile) {
      const filePath = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('community-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        return;
      }

      const { data: urlData } = supabase.storage
        .from('community-images')
        .getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    }

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous';

    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      user_name: userName,
      user_avatar: user.user_metadata?.avatar_url || null,
      content,
      image_url: imageUrl,
      post_type: postType,
      asset_symbol: assetSymbol || null,
      signal: signal || null,
    });

    if (error) {
      toast({ title: 'Post failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Post created!' });
    fetchPosts();
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.liked_by_me) {
      await supabase
        .from('community_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
    } else {
      await supabase.from('community_likes').insert({
        user_id: user.id,
        post_id: postId,
      });
    }

    // Optimistic update
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      )
    );
  };

  const fetchComments = async (postId: string): Promise<CommunityComment[]> => {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return (data as CommunityComment[]) || [];
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous';

    const { error } = await supabase.from('community_comments').insert({
      user_id: user.id,
      post_id: postId,
      user_name: userName,
      content,
    });

    if (error) {
      toast({ title: 'Comment failed', description: error.message, variant: 'destructive' });
      return;
    }

    // Update comments count optimistically
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      )
    );
  };

  return { posts, loading, createPost, toggleLike, fetchComments, addComment, refetch: fetchPosts };
}
