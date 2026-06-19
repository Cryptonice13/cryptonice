
-- trading_strategies
CREATE TABLE public.trading_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  assets text[] NOT NULL DEFAULT '{}',
  exchange text NOT NULL DEFAULT 'binance',
  timeframe text NOT NULL DEFAULT '1h',
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  source text NOT NULL DEFAULT 'user',
  description text,
  last_backtest_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_strategies TO authenticated;
GRANT ALL ON public.trading_strategies TO service_role;
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own strategies select" ON public.trading_strategies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own strategies insert" ON public.trading_strategies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own strategies update" ON public.trading_strategies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own strategies delete" ON public.trading_strategies FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_trading_strategies_updated BEFORE UPDATE ON public.trading_strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- strategy_backtests
CREATE TABLE public.strategy_backtests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.trading_strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  exchange text NOT NULL,
  timeframe text NOT NULL,
  range_start timestamptz NOT NULL,
  range_end timestamptz NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  equity_curve jsonb NOT NULL DEFAULT '[]'::jsonb,
  trades jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.strategy_backtests TO authenticated;
GRANT ALL ON public.strategy_backtests TO service_role;
ALTER TABLE public.strategy_backtests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own backtests select" ON public.strategy_backtests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own backtests insert" ON public.strategy_backtests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own backtests delete" ON public.strategy_backtests FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- agent_runs
CREATE TABLE public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.agent_runs TO authenticated;
GRANT ALL ON public.agent_runs TO service_role;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs select" ON public.agent_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own runs insert" ON public.agent_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own runs update" ON public.agent_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
