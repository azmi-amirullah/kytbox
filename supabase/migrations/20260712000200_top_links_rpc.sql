-- Migration: 20260712000200_top_links_rpc.sql
-- Performs database-side analytics aggregation for top links by click counts.

CREATE OR REPLACE FUNCTION get_top_links(
  p_link_ids uuid[],
  p_start_date timestamptz,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  link_id uuid,
  click_count bigint
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
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
    le.link_id,
    COUNT(*)::bigint as click_count
  FROM link_events le
  WHERE le.link_id = ANY(p_link_ids)
    AND (p_start_date IS NULL OR le.created_at >= p_start_date)
  GROUP BY le.link_id
  ORDER BY click_count DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_top_links(uuid[], timestamptz, int) TO authenticated;
