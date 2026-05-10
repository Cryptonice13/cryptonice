-- ============================================================================
-- Lock down user_credits & credit_transactions writes
-- All mutations now go through SECURITY DEFINER RPCs invoked from edge
-- functions (service role) or the client (which still gets atomic checks).
-- ============================================================================

-- Drop existing public write policies
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own credit transactions" ON public.credit_transactions;

-- SELECT policies remain so the UI can still display the balance / history.
-- (No new SELECT policies needed.)

-- ----------------------------------------------------------------------------
-- Helper: ensure an account row exists (idempotent), return current balance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_credits_account(
  _user_id uuid,
  _wallet  text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_exists  boolean;
BEGIN
  IF _user_id IS NULL AND (_wallet IS NULL OR _wallet = '') THEN
    RAISE EXCEPTION 'identity_required';
  END IF;

  -- Caller must match the identity they're operating on (when signed in).
  IF _user_id IS NOT NULL AND auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'identity_mismatch';
  END IF;

  IF _user_id IS NOT NULL THEN
    SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = _user_id LIMIT 1;
  ELSE
    SELECT balance INTO v_balance FROM public.user_credits
      WHERE wallet_address = _wallet AND user_id IS NULL LIMIT 1;
  END IF;

  IF v_balance IS NOT NULL THEN
    RETURN v_balance;
  END IF;

  -- Create with signup bonus
  INSERT INTO public.user_credits (user_id, wallet_address, balance)
  VALUES (_user_id, CASE WHEN _user_id IS NULL THEN _wallet ELSE NULL END, 100);

  INSERT INTO public.credit_transactions (user_id, wallet_address, amount, transaction_type, description)
  VALUES (_user_id, CASE WHEN _user_id IS NULL THEN _wallet ELSE NULL END,
          100, 'signup_bonus', 'Welcome bonus - 100 free credits');

  RETURN 100;
END;
$$;

-- ----------------------------------------------------------------------------
-- Atomic deduct. Returns new balance, or -1 if insufficient funds.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  _user_id     uuid,
  _wallet      text,
  _amount      integer,
  _description text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id      uuid;
  v_balance integer;
BEGIN
  IF _amount IS NULL OR _amount <= 0 OR _amount > 1000 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  IF _user_id IS NULL AND (_wallet IS NULL OR _wallet = '') THEN
    RAISE EXCEPTION 'identity_required';
  END IF;
  IF _user_id IS NOT NULL AND auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'identity_mismatch';
  END IF;

  -- Lock the row
  IF _user_id IS NOT NULL THEN
    SELECT id, balance INTO v_id, v_balance
      FROM public.user_credits WHERE user_id = _user_id
      FOR UPDATE LIMIT 1;
  ELSE
    SELECT id, balance INTO v_id, v_balance
      FROM public.user_credits WHERE wallet_address = _wallet AND user_id IS NULL
      FOR UPDATE LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    -- Auto-create then re-lock
    PERFORM public.ensure_credits_account(_user_id, _wallet);
    IF _user_id IS NOT NULL THEN
      SELECT id, balance INTO v_id, v_balance
        FROM public.user_credits WHERE user_id = _user_id FOR UPDATE LIMIT 1;
    ELSE
      SELECT id, balance INTO v_id, v_balance
        FROM public.user_credits WHERE wallet_address = _wallet AND user_id IS NULL FOR UPDATE LIMIT 1;
    END IF;
  END IF;

  IF v_balance < _amount THEN
    RETURN -1;
  END IF;

  UPDATE public.user_credits
     SET balance = balance - _amount, updated_at = now()
   WHERE id = v_id;

  INSERT INTO public.credit_transactions (user_id, wallet_address, amount, transaction_type, description)
  VALUES (_user_id, CASE WHEN _user_id IS NULL THEN _wallet ELSE NULL END,
          -_amount, 'usage', COALESCE(_description, 'AI usage'));

  RETURN v_balance - _amount;
END;
$$;

-- ----------------------------------------------------------------------------
-- Daily login bonus (idempotent per UTC day). Returns new balance, or -1 if
-- already claimed today.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(
  _user_id uuid,
  _wallet  text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already integer;
  v_balance integer;
BEGIN
  IF _user_id IS NULL AND (_wallet IS NULL OR _wallet = '') THEN
    RAISE EXCEPTION 'identity_required';
  END IF;
  IF _user_id IS NOT NULL AND auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'identity_mismatch';
  END IF;

  PERFORM public.ensure_credits_account(_user_id, _wallet);

  SELECT count(*) INTO v_already
    FROM public.credit_transactions
   WHERE transaction_type = 'daily_login'
     AND created_at >= date_trunc('day', now())
     AND ((_user_id IS NOT NULL AND user_id = _user_id)
       OR (_user_id IS NULL AND wallet_address = _wallet));

  IF v_already > 0 THEN
    RETURN -1;
  END IF;

  UPDATE public.user_credits
     SET balance = balance + 10, updated_at = now()
   WHERE (_user_id IS NOT NULL AND user_id = _user_id)
      OR (_user_id IS NULL AND wallet_address = _wallet AND user_id IS NULL)
   RETURNING balance INTO v_balance;

  INSERT INTO public.credit_transactions (user_id, wallet_address, amount, transaction_type, description)
  VALUES (_user_id, CASE WHEN _user_id IS NULL THEN _wallet ELSE NULL END,
          10, 'daily_login', 'Daily login bonus - 10 credits');

  RETURN v_balance;
END;
$$;

-- ----------------------------------------------------------------------------
-- Add credits (used by purchase flow). Still trusts caller; payment processor
-- integration will replace this in a follow-up.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_credits(
  _user_id     uuid,
  _wallet      text,
  _amount      integer,
  _type        text,
  _description text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF _amount IS NULL OR _amount <= 0 OR _amount > 100000 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  IF _user_id IS NULL AND (_wallet IS NULL OR _wallet = '') THEN
    RAISE EXCEPTION 'identity_required';
  END IF;
  IF _user_id IS NOT NULL AND auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'identity_mismatch';
  END IF;

  PERFORM public.ensure_credits_account(_user_id, _wallet);

  UPDATE public.user_credits
     SET balance = balance + _amount, updated_at = now()
   WHERE (_user_id IS NOT NULL AND user_id = _user_id)
      OR (_user_id IS NULL AND wallet_address = _wallet AND user_id IS NULL)
   RETURNING balance INTO v_balance;

  INSERT INTO public.credit_transactions (user_id, wallet_address, amount, transaction_type, description)
  VALUES (_user_id, CASE WHEN _user_id IS NULL THEN _wallet ELSE NULL END,
          _amount, COALESCE(_type, 'adjustment'), _description);

  RETURN v_balance;
END;
$$;

-- Allow public/auth callers to invoke the RPCs (they self-validate identity)
REVOKE ALL ON FUNCTION public.ensure_credits_account(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_credits_atomic(uuid, text, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_daily_bonus(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_credits(uuid, text, integer, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ensure_credits_account(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits_atomic(uuid, text, integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_daily_bonus(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, text, integer, text, text) TO anon, authenticated, service_role;
