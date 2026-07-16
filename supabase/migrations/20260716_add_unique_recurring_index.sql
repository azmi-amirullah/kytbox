-- 1. Drop existing unique index if it exists
DROP INDEX IF EXISTS unique_recurring_monthly_entry;

-- 2. Create monthly unique index for recurring entries
CREATE UNIQUE INDEX unique_recurring_monthly_entry 
ON cashflow_entries (
  cashflow_id, 
  LOWER(TRIM(description)), 
  type, 
  EXTRACT(YEAR FROM date), 
  EXTRACT(MONTH FROM date)
) 
WHERE is_recurring = true;

-- 3. Create RPC to fetch latest entry of each series
CREATE OR REPLACE FUNCTION public.get_latest_recurring_templates(p_cashflow_id uuid)
RETURNS SETOF public.cashflow_entries
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT DISTINCT ON (LOWER(TRIM(description)), type) *
  FROM public.cashflow_entries
  WHERE cashflow_id = p_cashflow_id
  ORDER BY LOWER(TRIM(description)), type, date DESC, created_at DESC;
$$;
