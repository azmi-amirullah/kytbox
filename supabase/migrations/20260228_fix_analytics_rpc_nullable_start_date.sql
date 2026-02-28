-- Fix analytics RPC parameter nullability
-- Both RPCs already handle NULL in their WHERE clauses (p_start_date IS NULL OR ...)
-- but the parameters weren't declared with DEFAULT NULL, causing the generated
-- TypeScript types to require string instead of string | undefined.

CREATE OR REPLACE FUNCTION public.get_analytics_chart_data(
  p_link_ids uuid[],
  p_start_date timestamp with time zone DEFAULT NULL,
  p_bucket_interval text DEFAULT 'day'
)
RETURNS TABLE(bucket timestamp with time zone, click_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
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
$function$;

CREATE OR REPLACE FUNCTION public.get_top_referers(
  p_link_ids uuid[],
  p_start_date timestamp with time zone DEFAULT NULL,
  p_limit integer DEFAULT 5
)
RETURNS TABLE(referer_domain text, click_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
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
$function$;
