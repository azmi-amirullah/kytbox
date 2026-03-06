-- Add category column to cashflow_entries table
-- Nullable to ensure backward compatibility with existing entries
ALTER TABLE public.cashflow_entries
  ADD COLUMN category text;

-- Create an index for faster filtering and aggregations by category
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_category ON public.cashflow_entries(category);
