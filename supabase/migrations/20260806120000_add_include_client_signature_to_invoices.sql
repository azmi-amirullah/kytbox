-- Migration to update signature toggle column names for invoices table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'include_signature'
  ) THEN
    ALTER TABLE public.invoices RENAME COLUMN include_signature TO include_issuer_signature;
  END IF;
END $$;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS include_issuer_signature BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS include_client_signature BOOLEAN NOT NULL DEFAULT FALSE;
