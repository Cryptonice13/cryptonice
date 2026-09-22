DROP FUNCTION IF EXISTS public.create_prediction_market(text, text, numeric, text, timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS public.place_prediction_order(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.create_prediction_market(
  _user_id uuid,
  _question text,
  _asset_symbol text,
  _target_price numeric,
  _direction text,
  _close_at timestamptz,
  _resolve_at timestamptz,
  _resolution_source text DEFAULT 'coingecko'
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
  IF coalesce(trim(_resolution_source), '') NOT IN ('coingecko', 'platform_review') THEN RAISE EXCEPTION 'invalid_resolution_source'; END IF;

  INSERT INTO public.prediction_markets (creator_id, question, asset_symbol, target_price, direction, close_at, resolve_at, resolution_source)
  VALUES (_user_id, v_question, v_asset, _target_price, v_direction, _close_at, _resolve_at, coalesce(trim(_resolution_source), 'coingecko'))
  RETURNING id INTO v_id;

  INSERT INTO public.prediction_market_events (market_id, actor_id, event_type, payload)
  VALUES (v_id, _user_id, 'created', jsonb_build_object('asset_symbol', v_asset, 'target_price', _target_price, 'direction', v_direction));
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_prediction_order(
  _user_id uuid,
  _market_id uuid,
  _side text,
  _price integer,
  _quantity integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_market public.prediction_markets%ROWTYPE;
  v_side text := lower(trim(_side));
  v_cost integer;
  v_balance integer;
  v_order_id uuid;
  v_existing public.prediction_positions%ROWTYPE;
  v_new_quantity integer;
  v_new_cost integer;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF v_side NOT IN ('yes', 'no') THEN RAISE EXCEPTION 'invalid_side'; END IF;
  IF _price < 1 OR _price > 99 OR _quantity < 1 OR _quantity > 100000 THEN RAISE EXCEPTION 'invalid_order'; END IF;

  SELECT * INTO v_market FROM public.prediction_markets WHERE id = _market_id FOR UPDATE;
  IF v_market.id IS NULL THEN RAISE EXCEPTION 'market_not_found'; END IF;
  IF v_market.status <> 'open' OR now() >= v_market.close_at THEN RAISE EXCEPTION 'market_closed'; END IF;
  IF v_market.creator_id = _user_id THEN RAISE EXCEPTION 'creator_cannot_trade_own_market'; END IF;

  v_cost := _price * _quantity;
  SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = _user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'credits_account_required'; END IF;
  IF v_balance < v_cost THEN RAISE EXCEPTION 'insufficient_credits'; END IF;

  UPDATE public.user_credits SET balance = balance - v_cost, updated_at = now() WHERE user_id = _user_id;
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (_user_id, -v_cost, 'prediction_trade', format('Bought %s %s shares in %s', _quantity, upper(v_side), v_market.asset_symbol));

  INSERT INTO public.prediction_orders (market_id, user_id, side, price, quantity, remaining_quantity, reserved_credits, status)
  VALUES (_market_id, _user_id, v_side, _price, _quantity, 0, 0, 'filled')
  RETURNING id INTO v_order_id;

  INSERT INTO public.prediction_trades (market_id, order_id, user_id, side, price, quantity)
  VALUES (_market_id, v_order_id, _user_id, v_side, _price, _quantity);

  SELECT * INTO v_existing FROM public.prediction_positions WHERE market_id = _market_id AND user_id = _user_id AND side = v_side FOR UPDATE;
  IF v_existing.id IS NULL THEN
    INSERT INTO public.prediction_positions (market_id, user_id, side, quantity, average_price, total_cost)
    VALUES (_market_id, _user_id, v_side, _quantity, _price, v_cost);
  ELSE
    v_new_quantity := v_existing.quantity + _quantity;
    v_new_cost := v_existing.total_cost + v_cost;
    UPDATE public.prediction_positions SET quantity = v_new_quantity, total_cost = v_new_cost, average_price = v_new_cost::numeric / v_new_quantity WHERE id = v_existing.id;
  END IF;

  UPDATE public.prediction_markets
     SET volume_credits = volume_credits + v_cost,
         participant_count = (SELECT count(DISTINCT user_id) FROM public.prediction_trades WHERE market_id = _market_id),
         yes_price = CASE WHEN v_side = 'yes' THEN _price ELSE yes_price END,
         no_price = CASE WHEN v_side = 'no' THEN _price ELSE no_price END
   WHERE id = _market_id;

  INSERT INTO public.prediction_market_events (market_id, actor_id, event_type, payload)
  VALUES (_market_id, _user_id, 'trade', jsonb_build_object('side', v_side, 'price', _price, 'quantity', _quantity, 'cost', v_cost));

  RETURN jsonb_build_object('order_id', v_order_id, 'cost', v_cost, 'side', v_side, 'price', _price, 'quantity', _quantity);
END;
$$;

REVOKE ALL ON FUNCTION public.create_prediction_market(uuid, text, text, numeric, text, timestamptz, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_prediction_order(uuid, uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_prediction_market(uuid, text, text, numeric, text, timestamptz, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.place_prediction_order(uuid, uuid, text, integer, integer) TO service_role;