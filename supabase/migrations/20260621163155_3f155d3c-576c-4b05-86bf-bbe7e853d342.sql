
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'deduct_credits_atomic(uuid,text,integer,text)',
    'ensure_credits_account(uuid,text)',
    'claim_daily_bonus(uuid,text)',
    'add_credits(uuid,text,integer,text,text)',
    'get_public_profiles(uuid[])',
    'search_public_profiles(text)',
    'get_flexes_with_urls(text,integer,integer)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC', fn);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
  END LOOP;
END$$;
