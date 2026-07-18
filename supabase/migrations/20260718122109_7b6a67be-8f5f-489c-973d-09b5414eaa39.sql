
-- 1. credit_purchases: remove client write policies
DROP POLICY IF EXISTS "Owner can insert" ON public.credit_purchases;
DROP POLICY IF EXISTS "Owner can update" ON public.credit_purchases;
DROP POLICY IF EXISTS "Owner can delete" ON public.credit_purchases;

-- 2. credit_transactions: remove client write policies
DROP POLICY IF EXISTS "Owner can insert" ON public.credit_transactions;
DROP POLICY IF EXISTS "Owner can update" ON public.credit_transactions;
DROP POLICY IF EXISTS "Owner can delete" ON public.credit_transactions;

-- 3. user_credits: remove client write policies (balance mutations only via SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "Owner can insert" ON public.user_credits;
DROP POLICY IF EXISTS "Owner can update" ON public.user_credits;
DROP POLICY IF EXISTS "Owner can delete" ON public.user_credits;

-- 4. profiles: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. storage.objects: restrict listing of community-images to owner's folder.
-- Public URL access for the bucket is unaffected (public buckets serve files without RLS).
DROP POLICY IF EXISTS "Anyone can view community images" ON storage.objects;

CREATE POLICY "Users can list their own community-images folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 6. Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions that
-- are trigger-only or admin-only (must not be callable via the API).
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_post_comments_count() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, text, integer, text, text) FROM anon, authenticated, PUBLIC;

-- Revoke anon EXECUTE on client-callable RPCs (authenticated retained where needed).
REVOKE EXECUTE ON FUNCTION public.deduct_credits_atomic(uuid, text, integer, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_credits_account(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_daily_bonus(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_public_profiles(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_flexes_with_urls(text, integer, integer) FROM anon, PUBLIC;
