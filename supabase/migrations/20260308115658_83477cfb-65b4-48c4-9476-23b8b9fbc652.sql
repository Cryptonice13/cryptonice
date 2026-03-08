
CREATE TABLE public.ai_portfolio_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  wallet_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  health_score numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'medium',
  diversification text NOT NULL DEFAULT 'moderate',
  portfolio_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.ai_portfolio_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own portfolio analysis"
  ON public.ai_portfolio_analysis FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can view their own portfolio analysis"
  ON public.ai_portfolio_analysis FOR SELECT
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can delete their own portfolio analysis"
  ON public.ai_portfolio_analysis FOR DELETE
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));
