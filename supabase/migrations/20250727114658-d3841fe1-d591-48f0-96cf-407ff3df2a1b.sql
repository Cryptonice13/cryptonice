-- Create loan_requests table for storing loan applications
CREATE TABLE public.loan_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_amount DECIMAL(15,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  business_name TEXT,
  owner_name TEXT NOT NULL,
  country TEXT NOT NULL,
  income_estimate DECIMAL(15,2),
  id_proof_hash TEXT,
  business_registration_hash TEXT,
  status TEXT NOT NULL DEFAULT 'Pending Review',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for loan_requests
CREATE POLICY "Users can view their own loan requests" 
ON public.loan_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loan requests" 
ON public.loan_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loan requests" 
ON public.loan_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_loan_requests_updated_at
BEFORE UPDATE ON public.loan_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();