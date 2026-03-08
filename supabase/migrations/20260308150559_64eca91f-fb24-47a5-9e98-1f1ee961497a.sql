
-- Drop restrictive policies and recreate as permissive for alert_history
DROP POLICY IF EXISTS "Users can view their own alert history" ON public.alert_history;
DROP POLICY IF EXISTS "Users can insert their own alert history" ON public.alert_history;
DROP POLICY IF EXISTS "Users can update their own alert history" ON public.alert_history;

CREATE POLICY "Users can view their own alert history"
  ON public.alert_history FOR SELECT
  TO authenticated, anon
  USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can insert their own alert history"
  ON public.alert_history FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can update their own alert history"
  ON public.alert_history FOR UPDATE
  USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));
