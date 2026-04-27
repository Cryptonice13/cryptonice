-- ==========================================
-- Token Safety Scanner: safety_scans table
-- ==========================================
CREATE TABLE public.safety_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  wallet_address TEXT,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  token_name TEXT,
  token_symbol TEXT,
  token_logo TEXT,

  -- Score & verdict
  risk_score INTEGER NOT NULL DEFAULT 0, -- 0 = safe, 100 = extreme risk
  risk_level TEXT NOT NULL DEFAULT 'unknown', -- safe | low | medium | high | critical
  ai_verdict TEXT,
  recommendation TEXT, -- BUY_OK | CAUTION | AVOID

  -- Raw data
  factors JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ key, label, severity, value, description }]
  goplus_data JSONB,
  dex_data JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_scans ENABLE ROW LEVEL SECURITY;

-- Read own scans
CREATE POLICY "Users view own safety scans"
ON public.safety_scans FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (user_id IS NULL AND wallet_address IS NOT NULL)
);

-- Insert own scans
CREATE POLICY "Users insert own safety scans"
ON public.safety_scans FOR INSERT
WITH CHECK (
  (auth.uid() = user_id)
  OR (user_id IS NULL AND wallet_address IS NOT NULL)
);

-- Delete own scans
CREATE POLICY "Users delete own safety scans"
ON public.safety_scans FOR DELETE
USING (
  (auth.uid() = user_id)
  OR (user_id IS NULL AND wallet_address IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_safety_scans_contract ON public.safety_scans (lower(contract_address), chain);
CREATE INDEX idx_safety_scans_user ON public.safety_scans (user_id, created_at DESC);
CREATE INDEX idx_safety_scans_wallet ON public.safety_scans (wallet_address, created_at DESC);
CREATE INDEX idx_safety_scans_recent ON public.safety_scans (created_at DESC);
