
-- Table for saved market predictions
CREATE TABLE public.ai_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  current_price numeric NOT NULL DEFAULT 0,
  prediction_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own predictions"
  ON public.ai_predictions FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can view their own predictions"
  ON public.ai_predictions FOR SELECT
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can delete their own predictions"
  ON public.ai_predictions FOR DELETE
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

-- Table for saved trading signals
CREATE TABLE public.ai_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  current_price numeric NOT NULL DEFAULT 0,
  signal_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own signals"
  ON public.ai_signals FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can view their own signals"
  ON public.ai_signals FOR SELECT
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can delete their own signals"
  ON public.ai_signals FOR DELETE
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

-- Table for saved whale activity
CREATE TABLE public.ai_whale_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  current_price numeric NOT NULL DEFAULT 0,
  whale_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_whale_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own whale activity"
  ON public.ai_whale_activity FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can view their own whale activity"
  ON public.ai_whale_activity FOR SELECT
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can delete their own whale activity"
  ON public.ai_whale_activity FOR DELETE
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));
