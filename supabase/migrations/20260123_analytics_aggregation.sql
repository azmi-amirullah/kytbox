-- Analytics Aggregation Function
-- Run this in your Supabase SQL Editor
-- This function aggregates link_events by time bucket on the database side
-- Much more efficient than fetching all rows and grouping in JavaScript

CREATE OR REPLACE FUNCTION get_analytics_chart_data(
  p_link_ids uuid[],
  p_start_date timestamptz,
  p_bucket_interval text  -- 'hour', 'day', or 'all'
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

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_analytics_chart_data(uuid[], timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_chart_data(uuid[], timestamptz, text) TO anon;



-- Top Referer Aggregation Function
-- Counts referers and returns top ones (done in DB for efficiency)

CREATE OR REPLACE FUNCTION get_top_referers(
  p_link_ids uuid[],
  p_start_date timestamptz,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  referer_domain text,
  click_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      regexp_replace(
        regexp_replace(referer, '^https?://(www\.)?', ''),
        '/.*$', ''
      ),
      'Direct'
    ) as referer_domain,
    COUNT(*)::bigint as click_count
  FROM link_events
  WHERE link_id = ANY(p_link_ids)
    AND (p_start_date IS NULL OR created_at >= p_start_date)
  GROUP BY referer_domain
  ORDER BY click_count DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_top_referers(uuid[], timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_referers(uuid[], timestamptz, int) TO anon;
