
-- 1) Profiles: drop broad authenticated read
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Safe public lookup function (no email)
CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE (user_id uuid, name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(_ids)
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_public_profiles(_query text)
RETURNS TABLE (user_id uuid, name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.name, p.avatar_url
  FROM public.profiles p
  WHERE _query IS NOT NULL
    AND length(trim(_query)) > 0
    AND (p.name ILIKE '%' || _query || '%')
    AND p.user_id <> auth.uid()
  LIMIT 10
$$;

REVOKE ALL ON FUNCTION public.search_public_profiles(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text) TO authenticated;

-- 2) signal_followers: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view followers" ON public.signal_followers;
CREATE POLICY "Authenticated can view followers"
ON public.signal_followers
FOR SELECT
TO authenticated
USING (true);

-- 3) Storage: drop the overly-broad community-images INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload community images" ON storage.objects;
