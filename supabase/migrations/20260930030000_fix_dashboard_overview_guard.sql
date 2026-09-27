-- Migration: 20260930030000_fix_dashboard_overview_guard.sql
-- Same NULL bypass as get_recent_activity: `p_user_id != auth.uid()` is NULL
-- for callers without a JWT, which skipped the ownership check, and anon
-- holds EXECUTE on this SECURITY DEFINER function. Use IS DISTINCT FROM so a
-- missing auth.uid() is denied instead of silently allowed.
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
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
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
