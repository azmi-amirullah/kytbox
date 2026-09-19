-- Migration: 20260930000000_dashboard_security_and_performance_optimizations.sql
-- 1. Security: Enforce auth.uid() ownership checks on get_recent_activity and get_dashboard_overview RPCs
-- 2. Performance: Add composite index on link_events (link_id, created_at DESC)

-- 1. Secure get_recent_activity
CREATE OR REPLACE FUNCTION get_recent_activity(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE(
  type text,
  title text,
  context text,
  created_at timestamptz
) AS $$
BEGIN
  -- Security check: Ensure caller can only access their own activity
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access activity for another user';
  END IF;

  RETURN QUERY
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure get_dashboard_overview
CREATE OR REPLACE FUNCTION get_dashboard_overview(
  p_user_id uuid,
  p_activity_limit int DEFAULT 10
)
RETURNS jsonb AS $$
DECLARE
  v_clicks_count bigint;
  v_cashflow_balance numeric;
  v_active_tasks_count bigint;
  v_seven_days_ago timestamptz := now() - interval '7 days';
  v_recent_activity jsonb;
BEGIN
  -- Security check: Ensure caller can only access their own dashboard overview
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access dashboard overview for another user';
  END IF;

  -- 1. Bio Clicks count in last 7 days
  SELECT count(le.id) INTO v_clicks_count
  FROM link_events le
  JOIN links l ON le.link_id = l.id
  WHERE l.user_id = p_user_id
    AND le.created_at >= v_seven_days_ago;

  -- 2. Cashflow Balance combined sum
  SELECT coalesce(sum(balance), 0) INTO v_cashflow_balance
  FROM cashflow_summaries
  WHERE user_id = p_user_id;

  -- 3. Active uncompleted list tasks count
  SELECT count(li.id) INTO v_active_tasks_count
  FROM list_items li
  JOIN lists l ON li.list_id = l.id
  WHERE l.user_id = p_user_id
    AND li.is_completed = false;

  -- 4. Recent activity feed
  SELECT coalesce(jsonb_agg(act), '[]'::jsonb) INTO v_recent_activity
  FROM (
    SELECT type, title, context, created_at
    FROM get_recent_activity(p_user_id, p_activity_limit)
  ) act;

  RETURN jsonb_build_object(
    'clicks_count', v_clicks_count,
    'cashflow_balance', v_cashflow_balance,
    'active_tasks_count', v_active_tasks_count,
    'recent_activity', v_recent_activity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Performance: Add composite index for link click counting and foreign key lookup
CREATE INDEX IF NOT EXISTS idx_link_events_link_created_at ON public.link_events (link_id, created_at DESC);
