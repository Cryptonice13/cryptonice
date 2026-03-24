CREATE POLICY "Users can update own posts"
ON public.community_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);