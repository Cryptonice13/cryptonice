-- Allow authenticated users to view basic profile info (needed for friends list, messages, search)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);