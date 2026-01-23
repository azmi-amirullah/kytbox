-- Update analytics RPC function to support monthly aggregation
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_analytics_chart_data(
  p_link_ids uuid[],
  p_start_date timestamptz,
  p_bucket_interval text  -- 'hour', 'day', 'month', or 'all'
)
RETURNS TABLE (
  bucket timestamptz,
  click_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_bucket_interval = 'all' THEN
    -- Lifetime: return single aggregated count
    RETURN QUERY
    SELECT 
      NULL::timestamptz as bucket,
      COUNT(*)::bigint as click_count
    FROM link_events
    WHERE link_id = ANY(p_link_ids)
      AND (p_start_date IS NULL OR created_at >= p_start_date);
  ELSE
    -- Time-bucket aggregation
    RETURN QUERY
    SELECT 
      date_trunc(p_bucket_interval, created_at) as bucket,
      COUNT(*)::bigint as click_count
    FROM link_events
    WHERE link_id = ANY(p_link_ids)
      AND (p_start_date IS NULL OR created_at >= p_start_date)
    GROUP BY date_trunc(p_bucket_interval, created_at)
    ORDER BY bucket;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_analytics_chart_data(uuid[], timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_chart_data(uuid[], timestamptz, text) TO anon;
