-- Migration: 20260717_get_analytics_by_country.sql
-- Description: RPC for country-based click aggregation with user authorization check (fixed column reference ambiguity)

CREATE OR REPLACE FUNCTION get_analytics_by_country(
  p_link_ids uuid[],
  p_start_date timestamptz DEFAULT NULL
)
RETURNS TABLE(country text, click_count bigint) AS $$
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
  SELECT
    COALESCE(link_events.country, 'Unknown') AS country,
    COUNT(*)::bigint AS click_count
  FROM link_events
  WHERE link_id = ANY(p_link_ids)
    AND (p_start_date IS NULL OR created_at >= p_start_date)
  GROUP BY COALESCE(link_events.country, 'Unknown')
  ORDER BY click_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_analytics_by_country(uuid[], timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_by_country(uuid[], timestamptz) TO anon;
