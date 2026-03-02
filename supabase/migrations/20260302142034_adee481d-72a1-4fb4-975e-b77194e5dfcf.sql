
CREATE TABLE public.strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  asset_symbol text NOT NULL,
  asset_id text NOT NULL,
  strategy_name text NOT NULL,
  strategy_type text NOT NULL,
  risk_level text NOT NULL DEFAULT 'moderate',
  timeframe text NOT NULL DEFAULT '1W',
  investment_amount numeric NOT NULL DEFAULT 0,
  signal text NOT NULL DEFAULT 'HOLD',
  entry_price numeric,
  exit_price numeric,
  stop_loss numeric,
  take_profits jsonb DEFAULT '[]'::jsonb,
  position_size numeric,
  risk_reward numeric,
  win_rate numeric,
  confidence numeric,
  conditions jsonb DEFAULT '[]'::jsonb,
  reasoning text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strategies"
ON public.strategies FOR SELECT
USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can insert their own strategies"
ON public.strategies FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can update their own strategies"
ON public.strategies FOR UPDATE
USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE POLICY "Users can delete their own strategies"
ON public.strategies FOR DELETE
USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (wallet_address IS NOT NULL)));

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
