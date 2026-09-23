DROP POLICY IF EXISTS "Authenticated users can view prediction activity" ON public.prediction_trades;
CREATE POLICY "Users can view their own prediction activity"
  ON public.prediction_trades
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());