-- Migration: 20260717_get_analytics_by_country.sql
-- Description: RPC for country-based click and view aggregation with user authorization check

CREATE OR REPLACE FUNCTION get_analytics_by_country(
  p_link_ids uuid[],
  p_start_date timestamptz DEFAULT NULL,
  p_include_views boolean DEFAULT true
)
RETURNS TABLE(country text, click_count bigint, view_count bigint) AS $$
BEGIN
  -- Security check: Ensure all p_link_ids belong to the authenticated user
  IF EXISTS (
    SELECT 1 FROM links 
    WHERE id = ANY(p_link_ids) 
    AND user_id != auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: One or more link IDs do not belong to you';
  END IF;

  RETURN QUERY
  WITH clicks AS (
    SELECT
      COALESCE(link_events.country, 'Unknown') AS country,
      COUNT(*)::bigint AS click_count
    FROM link_events
    WHERE link_id = ANY(p_link_ids)
      AND (p_start_date IS NULL OR created_at >= p_start_date)
    GROUP BY COALESCE(link_events.country, 'Unknown')
  ),
  views AS (
    SELECT
      COALESCE(profile_events.country, 'Unknown') AS country,
      COUNT(*)::bigint AS view_count
    FROM profile_events
    WHERE p_include_views = true
      AND profile_id = auth.uid()
      AND (p_start_date IS NULL OR created_at >= p_start_date)
    GROUP BY COALESCE(profile_events.country, 'Unknown')
  )
  SELECT
    COALESCE(c.country, v.country) AS country,
    COALESCE(c.click_count, 0)::bigint AS click_count,
    COALESCE(v.view_count, 0)::bigint AS view_count
  FROM clicks c
  FULL OUTER JOIN views v ON c.country = v.country
  ORDER BY click_count DESC, view_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_analytics_by_country(uuid[], timestamptz, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_by_country(uuid[], timestamptz, boolean) TO anon;
