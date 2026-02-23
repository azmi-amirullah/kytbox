-- Add missing email index to cashflow_shares for performance
CREATE INDEX IF NOT EXISTS idx_cashflow_shares_email ON public.cashflow_shares (email);
