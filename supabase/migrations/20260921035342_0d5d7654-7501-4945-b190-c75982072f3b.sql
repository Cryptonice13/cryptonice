CREATE TABLE public.prediction_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  question text NOT NULL,
  asset_symbol text NOT NULL,
  target_price numeric NOT NULL,
  direction text NOT NULL,
  close_at timestamptz NOT NULL,
  resolve_at timestamptz NOT NULL,
  resolution_source text NOT NULL DEFAULT 'coingecko',
  status text NOT NULL DEFAULT 'open',
  outcome text,
  observed_price numeric,
  resolved_at timestamptz,
  settlement_note text,
  yes_price numeric NOT NULL DEFAULT 50,
  no_price numeric NOT NULL DEFAULT 50,
  volume_credits integer NOT NULL DEFAULT 0,
  participant_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prediction_markets TO authenticated;
GRANT ALL ON public.prediction_markets TO service_role;
ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can browse prediction markets" ON public.prediction_markets FOR SELECT TO authenticated USING (status <> 'draft' OR creator_id = auth.uid());

CREATE TABLE public.prediction_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  side text NOT NULL,
  price integer NOT NULL,
  quantity integer NOT NULL,
  remaining_quantity integer NOT NULL DEFAULT 0,
  reserved_credits integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'filled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prediction_orders TO authenticated;
GRANT ALL ON public.prediction_orders TO service_role;
ALTER TABLE public.prediction_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own prediction orders" ON public.prediction_orders FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.prediction_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.prediction_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  side text NOT NULL,
  price integer NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prediction_trades TO authenticated;
GRANT ALL ON public.prediction_trades TO service_role;
ALTER TABLE public.prediction_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view prediction activity" ON public.prediction_trades FOR SELECT TO authenticated USING (true);

CREATE TABLE public.prediction_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  side text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  average_price numeric NOT NULL DEFAULT 0,
  total_cost integer NOT NULL DEFAULT 0,
  payout integer NOT NULL DEFAULT 0,
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_id, user_id, side)
);
GRANT SELECT ON public.prediction_positions TO authenticated;
GRANT ALL ON public.prediction_positions TO service_role;
ALTER TABLE public.prediction_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own prediction positions" ON public.prediction_positions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.prediction_market_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prediction_market_events TO authenticated;
GRANT ALL ON public.prediction_market_events TO service_role;
ALTER TABLE public.prediction_market_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view prediction market events" ON public.prediction_market_events FOR SELECT TO authenticated USING (true);

CREATE INDEX prediction_markets_status_close_idx ON public.prediction_markets(status, close_at);
CREATE INDEX prediction_orders_market_idx ON public.prediction_orders(market_id, created_at DESC);
CREATE INDEX prediction_trades_market_idx ON public.prediction_trades(market_id, created_at DESC);
CREATE INDEX prediction_positions_user_idx ON public.prediction_positions(user_id, updated_at DESC);
CREATE INDEX prediction_events_market_idx ON public.prediction_market_events(market_id, created_at DESC);

CREATE TRIGGER update_prediction_markets_updated_at BEFORE UPDATE ON public.prediction_markets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prediction_orders_updated_at BEFORE UPDATE ON public.prediction_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prediction_positions_updated_at BEFORE UPDATE ON public.prediction_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_prediction_market(
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
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF length(v_question) < 15 OR length(v_question) > 240 THEN RAISE EXCEPTION 'invalid_question'; END IF;
  IF v_asset !~ '^[A-Z0-9]{2,12}$' THEN RAISE EXCEPTION 'invalid_asset'; END IF;
  IF _target_price IS NULL OR _target_price <= 0 THEN RAISE EXCEPTION 'invalid_target_price'; END IF;
  IF v_direction NOT IN ('above', 'below') THEN RAISE EXCEPTION 'invalid_direction'; END IF;
  IF _close_at <= now() OR _resolve_at <= _close_at OR _resolve_at > now() + interval '365 days' THEN RAISE EXCEPTION 'invalid_market_times'; END IF;
  IF coalesce(trim(_resolution_source), '') NOT IN ('coingecko', 'platform_review') THEN RAISE EXCEPTION 'invalid_resolution_source'; END IF;

  INSERT INTO public.prediction_markets (creator_id, question, asset_symbol, target_price, direction, close_at, resolve_at, resolution_source)
  VALUES (auth.uid(), v_question, v_asset, _target_price, v_direction, _close_at, _resolve_at, coalesce(trim(_resolution_source), 'coingecko'))
  RETURNING id INTO v_id;

  INSERT INTO public.prediction_market_events (market_id, actor_id, event_type, payload)
  VALUES (v_id, auth.uid(), 'created', jsonb_build_object('asset_symbol', v_asset, 'target_price', _target_price, 'direction', v_direction));
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_prediction_order(
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
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF v_side NOT IN ('yes', 'no') THEN RAISE EXCEPTION 'invalid_side'; END IF;
  IF _price < 1 OR _price > 99 OR _quantity < 1 OR _quantity > 100000 THEN RAISE EXCEPTION 'invalid_order'; END IF;

  SELECT * INTO v_market FROM public.prediction_markets WHERE id = _market_id FOR UPDATE;
  IF v_market.id IS NULL THEN RAISE EXCEPTION 'market_not_found'; END IF;
  IF v_market.status <> 'open' OR now() >= v_market.close_at THEN RAISE EXCEPTION 'market_closed'; END IF;
  IF v_market.creator_id = auth.uid() THEN RAISE EXCEPTION 'creator_cannot_trade_own_market'; END IF;

  v_cost := _price * _quantity;
  SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = auth.uid() FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'credits_account_required'; END IF;
  IF v_balance < v_cost THEN RAISE EXCEPTION 'insufficient_credits'; END IF;

  UPDATE public.user_credits SET balance = balance - v_cost, updated_at = now() WHERE user_id = auth.uid();
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (auth.uid(), -v_cost, 'prediction_trade', format('Bought %s %s shares in %s', _quantity, upper(v_side), v_market.asset_symbol));

  INSERT INTO public.prediction_orders (market_id, user_id, side, price, quantity, remaining_quantity, reserved_credits, status)
  VALUES (_market_id, auth.uid(), v_side, _price, _quantity, 0, 0, 'filled')
  RETURNING id INTO v_order_id;

  INSERT INTO public.prediction_trades (market_id, order_id, user_id, side, price, quantity)
  VALUES (_market_id, v_order_id, auth.uid(), v_side, _price, _quantity);

  SELECT * INTO v_existing FROM public.prediction_positions WHERE market_id = _market_id AND user_id = auth.uid() AND side = v_side FOR UPDATE;
  IF v_existing.id IS NULL THEN
    INSERT INTO public.prediction_positions (market_id, user_id, side, quantity, average_price, total_cost)
    VALUES (_market_id, auth.uid(), v_side, _quantity, _price, v_cost);
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
  VALUES (_market_id, auth.uid(), 'trade', jsonb_build_object('side', v_side, 'price', _price, 'quantity', _quantity, 'cost', v_cost));

  RETURN jsonb_build_object('order_id', v_order_id, 'cost', v_cost, 'side', v_side, 'price', _price, 'quantity', _quantity);
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_prediction_market(
  _market_id uuid,
  _outcome text,
  _observed_price numeric,
  _note text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_market public.prediction_markets%ROWTYPE;
  v_position public.prediction_positions%ROWTYPE;
  v_payout integer;
  v_outcome text := lower(trim(_outcome));
BEGIN
  IF current_user NOT IN ('service_role', 'postgres') THEN RAISE EXCEPTION 'resolver_only'; END IF;
  IF v_outcome NOT IN ('yes', 'no', 'cancelled') THEN RAISE EXCEPTION 'invalid_outcome'; END IF;
  SELECT * INTO v_market FROM public.prediction_markets WHERE id = _market_id FOR UPDATE;
  IF v_market.id IS NULL THEN RAISE EXCEPTION 'market_not_found'; END IF;
  IF v_market.status IN ('resolved', 'cancelled') THEN RETURN true; END IF;

  IF v_outcome = 'cancelled' THEN
    FOR v_position IN SELECT * FROM public.prediction_positions WHERE market_id = _market_id AND settled_at IS NULL FOR UPDATE LOOP
      v_payout := v_position.total_cost;
      IF v_payout > 0 THEN
        UPDATE public.user_credits SET balance = balance + v_payout, updated_at = now() WHERE user_id = v_position.user_id;
        INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description) VALUES (v_position.user_id, v_payout, 'prediction_refund', 'Prediction market cancelled - refund');
      END IF;
      UPDATE public.prediction_positions SET payout = v_payout, settled_at = now() WHERE id = v_position.id;
    END LOOP;
    UPDATE public.prediction_markets SET status = 'cancelled', outcome = 'cancelled', observed_price = _observed_price, resolved_at = now(), settlement_note = _note WHERE id = _market_id;
  ELSE
    FOR v_position IN SELECT * FROM public.prediction_positions WHERE market_id = _market_id AND settled_at IS NULL FOR UPDATE LOOP
      v_payout := CASE WHEN v_position.side = v_outcome THEN v_position.quantity * 100 ELSE 0 END;
      IF v_payout > 0 THEN
        UPDATE public.user_credits SET balance = balance + v_payout, updated_at = now() WHERE user_id = v_position.user_id;
        INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description) VALUES (v_position.user_id, v_payout, 'prediction_payout', 'Prediction market winning payout');
      END IF;
      UPDATE public.prediction_positions SET payout = v_payout, settled_at = now() WHERE id = v_position.id;
    END LOOP;
    UPDATE public.prediction_markets SET status = 'resolved', outcome = v_outcome, observed_price = _observed_price, resolved_at = now(), settlement_note = _note WHERE id = _market_id;
  END IF;

  INSERT INTO public.prediction_market_events (market_id, actor_id, event_type, payload)
  VALUES (_market_id, NULL, 'settled', jsonb_build_object('outcome', v_outcome, 'observed_price', _observed_price, 'note', _note));
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_prediction_market(text, text, numeric, text, timestamptz, timestamptz, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.place_prediction_order(uuid, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.settle_prediction_market(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_prediction_market(text, text, numeric, text, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_prediction_order(uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_prediction_market(uuid, text, numeric, text) TO service_role;