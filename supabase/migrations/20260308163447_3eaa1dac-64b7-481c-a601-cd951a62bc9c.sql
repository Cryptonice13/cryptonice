
-- Create user_credits table
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  balance integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can insert own credits" ON public.user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE USING (auth.uid() = user_id OR (user_id IS NULL AND wallet_address IS NOT NULL));

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  amount integer NOT NULL,
  transaction_type text NOT NULL DEFAULT 'usage',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can insert own credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND wallet_address IS NOT NULL));

-- Create credit_purchases table
CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  plan text NOT NULL,
  credits integer NOT NULL,
  amount_usd numeric NOT NULL,
  coupon_code text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id OR (user_id IS NULL AND wallet_address IS NOT NULL));

CREATE POLICY "Users can insert own credit purchases" ON public.credit_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND wallet_address IS NOT NULL));

-- Trigger for updated_at on user_credits
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
