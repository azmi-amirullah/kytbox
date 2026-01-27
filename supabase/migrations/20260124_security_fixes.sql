-- Security Fixes: Add ownership checks to existing RPCs
-- Run this in your Supabase SQL Editor

-- 1. Update get_analytics_chart_data to verify link ownership
CREATE OR REPLACE FUNCTION get_analytics_chart_data(
  p_link_ids uuid[],
  p_start_date timestamptz,
  p_bucket_interval text
)
RETURNS TABLE (
  bucket timestamptz,
  click_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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

  IF p_bucket_interval = 'all' THEN
    RETURN QUERY
    SELECT 
      NULL::timestamptz as bucket,
      COUNT(*)::bigint as click_count
    FROM link_events
    WHERE link_id = ANY(p_link_ids)
      AND (p_start_date IS NULL OR created_at >= p_start_date);
  ELSE
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

-- 2. Update get_top_referers to verify link ownership
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

-- 3. Update get_next_short_id to verify user ownership
CREATE OR REPLACE FUNCTION get_next_short_id(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_id integer;
BEGIN
  -- Security check: Ensure p_user_id is the authenticated user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot request short_id for another user';
  END IF;

  SELECT COALESCE(MAX(short_id), 0) + 1 INTO next_id
  FROM links
  WHERE user_id = p_user_id;
  
  RETURN next_id;
END;
$$;
