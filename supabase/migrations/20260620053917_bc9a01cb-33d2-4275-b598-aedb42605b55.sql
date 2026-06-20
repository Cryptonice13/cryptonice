
-- 1) paper_accounts
CREATE TABLE public.paper_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  base_currency text NOT NULL DEFAULT 'USDT',
  starting_balance numeric NOT NULL DEFAULT 10000,
  cash_balance numeric NOT NULL DEFAULT 10000,
  equity numeric NOT NULL DEFAULT 10000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, base_currency)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_accounts TO authenticated;
GRANT ALL ON public.paper_accounts TO service_role;
ALTER TABLE public.paper_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own paper account select" ON public.paper_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own paper account insert" ON public.paper_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own paper account update" ON public.paper_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own paper account delete" ON public.paper_accounts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER paper_accounts_updated BEFORE UPDATE ON public.paper_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) paper_positions
CREATE TABLE public.paper_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.trading_strategies(id) ON DELETE SET NULL,
  symbol text NOT NULL,
  exchange text NOT NULL DEFAULT 'binance',
  qty numeric NOT NULL,
  avg_entry numeric NOT NULL,
  stop_loss numeric,
  take_profit numeric,
  opened_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_positions TO authenticated;
GRANT ALL ON public.paper_positions TO service_role;
ALTER TABLE public.paper_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pos select" ON public.paper_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own pos insert" ON public.paper_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pos update" ON public.paper_positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own pos delete" ON public.paper_positions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX paper_positions_user_idx ON public.paper_positions(user_id);
CREATE TRIGGER paper_positions_updated BEFORE UPDATE ON public.paper_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) paper_orders
CREATE TABLE public.paper_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.trading_strategies(id) ON DELETE SET NULL,
  symbol text NOT NULL,
  exchange text NOT NULL DEFAULT 'binance',
  side text NOT NULL,
  order_type text NOT NULL DEFAULT 'market',
  qty numeric NOT NULL,
  price numeric NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  slippage_bps numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'filled',
  reason text,
  filled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_orders TO authenticated;
GRANT ALL ON public.paper_orders TO service_role;
ALTER TABLE public.paper_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ord select" ON public.paper_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ord insert" ON public.paper_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX paper_orders_user_idx ON public.paper_orders(user_id, filled_at DESC);

-- 4) paper_trades
CREATE TABLE public.paper_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.trading_strategies(id) ON DELETE SET NULL,
  symbol text NOT NULL,
  exchange text NOT NULL DEFAULT 'binance',
  side text NOT NULL DEFAULT 'long',
  qty numeric NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric NOT NULL,
  pnl numeric NOT NULL,
  pnl_pct numeric NOT NULL,
  opened_at timestamptz NOT NULL,
  closed_at timestamptz NOT NULL DEFAULT now(),
  reason_open text,
  reason_close text,
  ai_commentary text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_trades TO authenticated;
GRANT ALL ON public.paper_trades TO service_role;
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trade select" ON public.paper_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own trade insert" ON public.paper_trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX paper_trades_user_idx ON public.paper_trades(user_id, closed_at DESC);

-- 5) portfolio_targets
CREATE TABLE public.portfolio_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weights jsonb NOT NULL,
  rationale text,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_targets TO authenticated;
GRANT ALL ON public.portfolio_targets TO service_role;
ALTER TABLE public.portfolio_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own targets select" ON public.portfolio_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own targets insert" ON public.portfolio_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own targets delete" ON public.portfolio_targets FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX portfolio_targets_user_idx ON public.portfolio_targets(user_id, generated_at DESC);

-- 6) arbitrage_opportunities (public read)
CREATE TABLE public.arbitrage_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  exchange_a text NOT NULL,
  exchange_b text NOT NULL,
  price_a numeric NOT NULL,
  price_b numeric NOT NULL,
  spread_bps numeric NOT NULL,
  est_net_bps numeric NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.arbitrage_opportunities TO anon;
GRANT SELECT ON public.arbitrage_opportunities TO authenticated;
GRANT ALL ON public.arbitrage_opportunities TO service_role;
ALTER TABLE public.arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arb public read" ON public.arbitrage_opportunities FOR SELECT USING (true);
CREATE INDEX arb_detected_idx ON public.arbitrage_opportunities(detected_at DESC);
CREATE INDEX arb_symbol_idx ON public.arbitrage_opportunities(symbol, detected_at DESC);
