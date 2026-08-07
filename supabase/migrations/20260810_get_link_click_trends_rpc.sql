-- RPC function to fetch link click trends (this week vs last week)
CREATE OR REPLACE FUNCTION get_link_click_trends(p_user_id uuid)
RETURNS TABLE(
  link_id uuid,
  this_week bigint,
  last_week bigint
) AS $$
  SELECT
    l.id AS link_id,
    COUNT(CASE WHEN le.created_at >= (NOW() - INTERVAL '7 days') THEN 1 END) AS this_week,
    COUNT(CASE WHEN le.created_at >= (NOW() - INTERVAL '14 days') AND le.created_at < (NOW() - INTERVAL '7 days') THEN 1 END) AS last_week
  FROM links l
  LEFT JOIN link_events le ON le.link_id = l.id
  WHERE l.user_id = p_user_id
  GROUP BY l.id;
$$ LANGUAGE sql SECURITY DEFINER;
