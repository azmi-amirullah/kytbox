-- Migration: 20260930020000_fix_get_recent_activity_ambiguity.sql
-- Fixes ERROR 42702 "column reference is ambiguous": the plpgsql rewrite in
-- 20260930000000 turned the RETURNS TABLE columns (type, title, context,
-- created_at) into local variables, so the unqualified column refs in the
-- first UNION branch collided with them and the RPC failed on every call.
-- Also closes the NULL bypass: `p_user_id != auth.uid()` evaluates to NULL
-- for callers without a JWT, which skipped the ownership check entirely.
CREATE OR REPLACE FUNCTION get_recent_activity(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE(
  type text,
  title text,
  context text,
  created_at timestamptz
) AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access activity for another user';
  END IF;

  RETURN QUERY
  (SELECT 'link' AS type, links.title, 'Bio' AS context, links.created_at
   FROM links
   WHERE links.user_id = p_user_id
   ORDER BY links.created_at DESC
   LIMIT p_limit)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
