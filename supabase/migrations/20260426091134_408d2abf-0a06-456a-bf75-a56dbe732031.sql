-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- GAP 3: Daily Portfolio Briefs
-- ============================================
CREATE TABLE public.portfolio_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  wallet_address TEXT,
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  portfolio_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_value NUMERIC NOT NULL DEFAULT 0,
  day_change_pct NUMERIC NOT NULL DEFAULT 0,
  brief_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_portfolio_briefs_user_date 
  ON public.portfolio_briefs(user_id, brief_date) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_portfolio_briefs_wallet_date 
  ON public.portfolio_briefs(wallet_address, brief_date) WHERE wallet_address IS NOT NULL AND user_id IS NULL;
CREATE INDEX idx_portfolio_briefs_created ON public.portfolio_briefs(created_at DESC);

ALTER TABLE public.portfolio_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio briefs" ON public.portfolio_briefs
  FOR SELECT USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can insert own portfolio briefs" ON public.portfolio_briefs
  FOR INSERT WITH CHECK ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can delete own portfolio briefs" ON public.portfolio_briefs
  FOR DELETE USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

-- ============================================
-- GAP 4: Verified Signal Marketplace
-- ============================================
CREATE TABLE public.published_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_user_id UUID NOT NULL,
  asset_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset_name TEXT,
  asset_logo TEXT,
  signal TEXT NOT NULL CHECK (signal IN ('BUY','SELL','HOLD')),
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  take_profits JSONB NOT NULL DEFAULT '[]'::jsonb,
  timeframe TEXT NOT NULL DEFAULT '1W',
  reasoning TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','expired')),
  closed_price NUMERIC,
  closed_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('win','loss','breakeven','pending','expired')),
  pnl_pct NUMERIC,
  last_checked_at TIMESTAMPTZ
);

CREATE INDEX idx_published_signals_publisher ON public.published_signals(publisher_user_id);
CREATE INDEX idx_published_signals_status ON public.published_signals(status);
CREATE INDEX idx_published_signals_published ON public.published_signals(published_at DESC);

ALTER TABLE public.published_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published signals" ON public.published_signals
  FOR SELECT USING (true);

CREATE POLICY "Users can publish own signals" ON public.published_signals
  FOR INSERT WITH CHECK (auth.uid() = publisher_user_id);

CREATE POLICY "Users can update own signals" ON public.published_signals
  FOR UPDATE USING (auth.uid() = publisher_user_id);

CREATE POLICY "Users can delete own signals" ON public.published_signals
  FOR DELETE USING (auth.uid() = publisher_user_id);

-- Followers
CREATE TABLE public.signal_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL,
  publisher_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_user_id, publisher_user_id)
);

CREATE INDEX idx_signal_followers_publisher ON public.signal_followers(publisher_user_id);
CREATE INDEX idx_signal_followers_follower ON public.signal_followers(follower_user_id);

ALTER TABLE public.signal_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers" ON public.signal_followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow publishers" ON public.signal_followers
  FOR INSERT WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can unfollow publishers" ON public.signal_followers
  FOR DELETE USING (auth.uid() = follower_user_id);

-- Publisher stats view
CREATE OR REPLACE VIEW public.publisher_stats
WITH (security_invoker = true)
AS
SELECT
  ps.publisher_user_id,
  p.name AS publisher_name,
  p.avatar_url AS publisher_avatar,
  COUNT(*) AS total_signals,
  COUNT(*) FILTER (WHERE ps.status = 'active') AS active_signals,
  COUNT(*) FILTER (WHERE ps.outcome = 'win') AS wins,
  COUNT(*) FILTER (WHERE ps.outcome = 'loss') AS losses,
  CASE 
    WHEN COUNT(*) FILTER (WHERE ps.outcome IN ('win','loss')) > 0
    THEN ROUND(100.0 * COUNT(*) FILTER (WHERE ps.outcome = 'win')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE ps.outcome IN ('win','loss')), 0), 1)
    ELSE 0
  END AS win_rate,
  COALESCE(ROUND(AVG(ps.pnl_pct) FILTER (WHERE ps.pnl_pct IS NOT NULL)::NUMERIC, 2), 0) AS avg_pnl_pct,
  COALESCE(ROUND(SUM(ps.pnl_pct) FILTER (WHERE ps.pnl_pct IS NOT NULL)::NUMERIC, 2), 0) AS total_pnl_pct,
  (SELECT COUNT(*) FROM public.signal_followers sf WHERE sf.publisher_user_id = ps.publisher_user_id) AS follower_count,
  MAX(ps.published_at) AS last_signal_at
FROM public.published_signals ps
LEFT JOIN public.profiles p ON p.user_id = ps.publisher_user_id
GROUP BY ps.publisher_user_id, p.name, p.avatar_url;

-- ============================================
-- GAP 5: AI Conditional Alerts
-- ============================================
CREATE TABLE public.conditional_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  wallet_address TEXT,
  name TEXT NOT NULL,
  natural_language TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  logic TEXT NOT NULL DEFAULT 'AND' CHECK (logic IN ('AND','OR')),
  assets_involved TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  notify_via JSONB NOT NULL DEFAULT '{"in_app":true,"email":false}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','triggered')),
  triggered_at TIMESTAMPTZ,
  triggered_data JSONB,
  last_evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conditional_alerts_user ON public.conditional_alerts(user_id);
CREATE INDEX idx_conditional_alerts_wallet ON public.conditional_alerts(wallet_address);
CREATE INDEX idx_conditional_alerts_status ON public.conditional_alerts(status);

ALTER TABLE public.conditional_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conditional alerts" ON public.conditional_alerts
  FOR SELECT USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users insert own conditional alerts" ON public.conditional_alerts
  FOR INSERT WITH CHECK ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users update own conditional alerts" ON public.conditional_alerts
  FOR UPDATE USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users delete own conditional alerts" ON public.conditional_alerts
  FOR DELETE USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE TRIGGER update_conditional_alerts_updated_at
  BEFORE UPDATE ON public.conditional_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Cron jobs
-- ============================================
SELECT cron.schedule(
  'verify-published-signals-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ttqhdfxzrajwgpbkkhjj.supabase.co/functions/v1/verify-signals',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0cWhkZnh6cmFqd2dwYmtraGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjAwMjgsImV4cCI6MjA2OTAzNjAyOH0.ZB4PiYMnNSGPcK3Pe3Z_LStE_MQGeVFiL6ZyXgwukkY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'evaluate-conditional-alerts-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ttqhdfxzrajwgpbkkhjj.supabase.co/functions/v1/evaluate-conditional-alerts',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0cWhkZnh6cmFqd2dwYmtraGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjAwMjgsImV4cCI6MjA2OTAzNjAyOH0.ZB4PiYMnNSGPcK3Pe3Z_LStE_MQGeVFiL6ZyXgwukkY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);