
-- Storage bucket for community images
INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload community images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images');

CREATE POLICY "Anyone can view community images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'community-images');

CREATE POLICY "Users can delete own community images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Community posts table
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  user_avatar TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'general',
  asset_symbol TEXT,
  signal TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read posts"
ON public.community_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own posts"
ON public.community_posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON public.community_posts FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Community likes table
CREATE TABLE public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read likes"
ON public.community_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own likes"
ON public.community_likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON public.community_likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Community comments table
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read comments"
ON public.community_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own comments"
ON public.community_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.community_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
ON public.friendships FOR SELECT TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
ON public.friendships FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Addressee can update friendship status"
ON public.friendships FOR UPDATE TO authenticated
USING (auth.uid() = addressee_id);

-- Direct messages table
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
ON public.direct_messages FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update message read status"
ON public.direct_messages FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id);

-- Function to increment/decrement likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.community_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Function to increment/decrement comments_count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();
