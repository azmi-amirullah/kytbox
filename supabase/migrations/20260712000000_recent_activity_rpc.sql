-- Migration: 20260712000000_recent_activity_rpc.sql
CREATE OR REPLACE FUNCTION get_recent_activity(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE(
  type text,
  title text,
  context text,
  created_at timestamptz
) AS $$
  (SELECT 'link' AS type, title, 'Bio' AS context, created_at
   FROM links WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT p_limit)
  UNION ALL
  (SELECT 'entry' AS type, ce.description AS title,
   CASE WHEN ce.type = 'income' THEN 'Income' ELSE 'Expense' END AS context,
   ce.created_at
   FROM cashflow_entries ce
   JOIN cashflows c ON ce.cashflow_id = c.id
   WHERE c.user_id = p_user_id ORDER BY ce.created_at DESC LIMIT p_limit)
  UNION ALL
  (SELECT 'task' AS type, li.title, l.title AS context, li.created_at
   FROM list_items li
   JOIN lists l ON li.list_id = l.id
   WHERE l.user_id = p_user_id ORDER BY li.created_at DESC LIMIT p_limit)
  ORDER BY created_at DESC LIMIT p_limit;
$$ LANGUAGE sql SECURITY DEFINER;
