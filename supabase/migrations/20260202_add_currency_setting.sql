-- Add default_currency to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'USD';

-- Common currencies: USD, IDR, EUR, GBP, JPY, SGD, MYR, etc.
