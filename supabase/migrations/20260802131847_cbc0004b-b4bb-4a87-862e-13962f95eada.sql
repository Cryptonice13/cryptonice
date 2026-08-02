-- 1. community_comments: allow owners to edit their own comments (owner-scoped)
DROP POLICY IF EXISTS "Users can update own comments" ON public.community_comments;
CREATE POLICY "Users can update own comments"
ON public.community_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. community_likes: restrict reads to the liker or the post owner
DROP POLICY IF EXISTS "Anyone authenticated can read likes" ON public.community_likes;
CREATE POLICY "Users can read own likes or likes on their posts"
ON public.community_likes
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = community_likes.post_id AND p.user_id = auth.uid()
  )
);

-- 3. signal_followers: restrict reads to the parties involved
DROP POLICY IF EXISTS "Authenticated can view followers" ON public.signal_followers;
CREATE POLICY "Users can view their own follow relationships"
ON public.signal_followers
FOR SELECT
TO authenticated
USING (auth.uid() = follower_user_id OR auth.uid() = publisher_user_id);

-- Tighten write policies to authenticated role only
DROP POLICY IF EXISTS "Users can follow publishers" ON public.signal_followers;
CREATE POLICY "Users can follow publishers"
ON public.signal_followers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_user_id);

DROP POLICY IF EXISTS "Users can unfollow publishers" ON public.signal_followers;
CREATE POLICY "Users can unfollow publishers"
ON public.signal_followers
FOR DELETE
TO authenticated
USING (auth.uid() = follower_user_id);

-- 4. Revoke client access to privileged SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, text, integer, text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_flexes_with_urls(text, integer, integer) FROM anon, authenticated, PUBLIC;