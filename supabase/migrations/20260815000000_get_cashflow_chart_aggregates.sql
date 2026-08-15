-- Migration: 20260815000000_get_cashflow_chart_aggregates.sql
-- Aggregates cashflow entries by cashflow, month, type, and category for dashboard charts
-- Avoids loading raw transaction rows into memory and respects RLS via SECURITY INVOKER

CREATE OR REPLACE FUNCTION get_cashflow_chart_aggregates(
  p_cashflow_ids uuid[],
  p_start_date date DEFAULT NULL
)
RETURNS TABLE (
  cashflow_id uuid,
  month text,
  type text,
  category text,
  total_amount numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.cashflow_id,
    to_char(e.date, 'YYYY-MM') AS month,
    e.type::text,
    e.category::text,
    coalesce(SUM(e.amount), 0)::numeric AS total_amount
  FROM cashflow_entries e
  WHERE e.cashflow_id = ANY(p_cashflow_ids)
    AND (p_start_date IS NULL OR e.date >= p_start_date)
  GROUP BY e.cashflow_id, to_char(e.date, 'YYYY-MM'), e.type, e.category
  ORDER BY month ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_cashflow_chart_aggregates(uuid[], date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cashflow_chart_aggregates(uuid[], date) TO anon;
