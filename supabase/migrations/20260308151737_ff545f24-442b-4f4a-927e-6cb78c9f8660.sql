CREATE TABLE public.ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  wallet_address text,
  asset_id text NOT NULL,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  current_price numeric NOT NULL DEFAULT 0,
  analysis_type text NOT NULL,
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis"
  ON public.ai_analysis FOR SELECT
  TO authenticated, anon
  USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can insert their own analysis"
  ON public.ai_analysis FOR INSERT
  TO authenticated, anon
  WITH CHECK ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can delete their own analysis"
  ON public.ai_analysis FOR DELETE
  TO authenticated, anon
  USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));