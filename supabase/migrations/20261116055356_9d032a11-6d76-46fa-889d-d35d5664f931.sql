ALTER TABLE public.prediction_markets ALTER COLUMN resolution_source SET DEFAULT 'coinbase_spot';

CREATE OR REPLACE FUNCTION public.create_prediction_market(
  _user_id uuid,
  _question text,
  _asset_symbol text,
  _target_price numeric,
  _direction text,
  _close_at timestamptz,
  _resolve_at timestamptz,
  _resolution_source text DEFAULT 'coinbase_spot'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_question text := trim(_question);
  v_asset text := upper(trim(_asset_symbol));
  v_direction text := lower(trim(_direction));
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF length(v_question) < 15 OR length(v_question) > 240 THEN RAISE EXCEPTION 'invalid_question'; END IF;
  IF v_asset !~ '^[A-Z0-9]{2,12}$' THEN RAISE EXCEPTION 'invalid_asset'; END IF;
  IF _target_price IS NULL OR _target_price <= 0 THEN RAISE EXCEPTION 'invalid_target_price'; END IF;
  IF v_direction NOT IN ('above', 'below') THEN RAISE EXCEPTION 'invalid_direction'; END IF;
  IF _close_at <= now() OR _resolve_at <= _close_at OR _resolve_at > now() + interval '365 days' THEN RAISE EXCEPTION 'invalid_market_times'; END IF;
  IF coalesce(trim(_resolution_source), '') NOT IN ('coinbase_spot', 'coingecko', 'platform_review') THEN RAISE EXCEPTION 'invalid_resolution_source'; END IF;

  INSERT INTO public.prediction_markets (creator_id, question, asset_symbol, target_price, direction, close_at, resolve_at, resolution_source)
  VALUES (_user_id, v_question, v_asset, _target_price, v_direction, _close_at, _resolve_at, coalesce(trim(_resolution_source), 'coinbase_spot'))
  RETURNING id INTO v_id;

  INSERT INTO public.prediction_market_events (market_id, actor_id, event_type, payload)
  VALUES (v_id, _user_id, 'created', jsonb_build_object('asset_symbol', v_asset, 'target_price', _target_price, 'direction', v_direction));
  RETURN v_id;
END;
$$;