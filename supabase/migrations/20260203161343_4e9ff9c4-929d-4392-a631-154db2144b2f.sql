-- Create user_portfolio table to persist portfolio positions
CREATE TABLE public.user_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  asset_logo TEXT,
  amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
  avg_buy_price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, asset_id)
);

-- Create user_watchlist table to persist watchlist items with alerts
CREATE TABLE public.user_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  asset_logo TEXT,
  alert_price DECIMAL(20, 8),
  alert_type TEXT CHECK (alert_type IN ('above', 'below')),
  alert_triggered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, asset_id)
);

-- Create portfolio_transactions table to track buy/sell history
CREATE TABLE public.portfolio_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  amount DECIMAL(20, 8) NOT NULL,
  price_per_unit DECIMAL(20, 8) NOT NULL,
  total_value DECIMAL(20, 8) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alert_history table to track triggered alerts
CREATE TABLE public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below')),
  target_price DECIMAL(20, 8) NOT NULL,
  triggered_price DECIMAL(20, 8) NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on all tables
ALTER TABLE public.user_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_portfolio
CREATE POLICY "Users can view their own portfolio" ON public.user_portfolio
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can insert their own portfolio" ON public.user_portfolio
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can update their own portfolio" ON public.user_portfolio
  FOR UPDATE USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can delete their own portfolio" ON public.user_portfolio
  FOR DELETE USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

-- RLS Policies for user_watchlist
CREATE POLICY "Users can view their own watchlist" ON public.user_watchlist
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can insert their own watchlist" ON public.user_watchlist
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can update their own watchlist" ON public.user_watchlist
  FOR UPDATE USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can delete their own watchlist" ON public.user_watchlist
  FOR DELETE USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

-- RLS Policies for portfolio_transactions
CREATE POLICY "Users can view their own transactions" ON public.portfolio_transactions
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can insert their own transactions" ON public.portfolio_transactions
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

-- RLS Policies for alert_history
CREATE POLICY "Users can view their own alert history" ON public.alert_history
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can insert their own alert history" ON public.alert_history
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

CREATE POLICY "Users can update their own alert history" ON public.alert_history
  FOR UPDATE USING (
    (auth.uid() = user_id) OR 
    ((user_id IS NULL) AND (wallet_address IS NOT NULL))
  );

-- Create triggers for updated_at
CREATE TRIGGER update_user_portfolio_updated_at
  BEFORE UPDATE ON public.user_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_watchlist_updated_at
  BEFORE UPDATE ON public.user_watchlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();