-- Update loan_requests table to match frontend form structure
-- Add new columns for collateral-based loans
ALTER TABLE public.loan_requests 
ADD COLUMN IF NOT EXISTS interest_type text,
ADD COLUMN IF NOT EXISTS collateral_type text,
ADD COLUMN IF NOT EXISTS asset_name text,
ADD COLUMN IF NOT EXISTS collateral_value numeric;

-- Make some existing columns nullable since they're not used in current form
ALTER TABLE public.loan_requests 
ALTER COLUMN purpose DROP NOT NULL,
ALTER COLUMN business_name DROP NOT NULL,
ALTER COLUMN owner_name DROP NOT NULL,
ALTER COLUMN country DROP NOT NULL;