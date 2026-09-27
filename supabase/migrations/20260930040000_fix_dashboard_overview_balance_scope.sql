-- Migration: 20260930040000_fix_dashboard_overview_balance_scope.sql
-- Align get_dashboard_overview's cashflow balance with the /app quick stats
-- page logic: the RPC summed every cashflow owned by the user (archived
-- included, shared excluded), while the page sums own non-archived cashflows
-- plus shared cashflows flagged is_included_in_totals. The caller's email is
-- read from the JWT so the function signature stays unchanged.
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
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
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

  -- 2. Cashflow Balance: own non-archived + shared cashflows included in totals
  SELECT coalesce(sum(s.balance), 0) INTO v_cashflow_balance
  FROM cashflow_summaries s
  WHERE (s.user_id = p_user_id AND s.is_archived = false)
     OR s.id IN (
       SELECT cs.cashflow_id
       FROM cashflow_shares cs
       WHERE cs.email = v_email
         AND cs.is_included_in_totals = true
     );

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
