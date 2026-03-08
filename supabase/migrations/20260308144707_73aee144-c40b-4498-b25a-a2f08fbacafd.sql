
CREATE TABLE public.ai_alert_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  wallet_address text,
  asset_id text NOT NULL,
  asset_symbol text NOT NULL,
  suggestion_type text NOT NULL DEFAULT 'above',
  target_price numeric NOT NULL,
  reasoning text,
  confidence numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_alert_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ai alert suggestions"
  ON public.ai_alert_suggestions FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can insert their own ai alert suggestions"
  ON public.ai_alert_suggestions FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can delete their own ai alert suggestions"
  ON public.ai_alert_suggestions FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can update their own ai alert suggestions"
  ON public.ai_alert_suggestions FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL));
