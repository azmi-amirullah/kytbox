-- Admin Users Overview RPC with correlated subquery aggregations
CREATE OR REPLACE FUNCTION public.get_admin_users_overview(
    p_search text DEFAULT NULL,
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    username text,
    display_name text,
    avatar_url text,
    email text,
    role text,
    created_at timestamp with time zone,
    has_completed_onboarding boolean,
    links_count integer,
    cashflows_count integer,
    lists_count integer,
    vehicles_count integer,
    invoices_count integer,
    has_custom_domain boolean,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_clean_search text;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.profiles
         WHERE profiles.id = v_user_id
           AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    v_clean_search := NULLIF(trim(p_search), '');

    RETURN QUERY
    WITH filtered_profiles AS (
        SELECT 
            p.id,
            p.username,
            p.display_name,
            p.avatar_url,
            au.email::text AS email,
            COALESCE(p.role, 'user') AS role,
            p.created_at,
            p.has_completed_onboarding
        FROM public.profiles p
        LEFT JOIN auth.users au ON au.id = p.id
        WHERE v_clean_search IS NULL
           OR p.username ILIKE ('%' || v_clean_search || '%')
           OR p.display_name ILIKE ('%' || v_clean_search || '%')
           OR au.email ILIKE ('%' || v_clean_search || '%')
    ),
    counted_totals AS (
        SELECT COUNT(*)::bigint AS full_count FROM filtered_profiles
    )
    SELECT
        fp.id,
        fp.username,
        fp.display_name,
        fp.avatar_url,
        fp.email,
        fp.role,
        fp.created_at,
        fp.has_completed_onboarding,
        (SELECT COUNT(*)::integer FROM public.links l WHERE l.user_id = fp.id) AS links_count,
        (SELECT COUNT(*)::integer FROM public.cashflows c WHERE c.user_id = fp.id) AS cashflows_count,
        (SELECT COUNT(*)::integer FROM public.lists lst WHERE lst.user_id = fp.id) AS lists_count,
        (SELECT COUNT(*)::integer FROM public.vehicles v WHERE v.user_id = fp.id) AS vehicles_count,
        (SELECT COUNT(*)::integer FROM public.invoices inv WHERE inv.user_id = fp.id) AS invoices_count,
        EXISTS(SELECT 1 FROM public.custom_domains cd WHERE cd.profile_id = fp.id) AS has_custom_domain,
        ct.full_count AS total_count
    FROM filtered_profiles fp
    CROSS JOIN counted_totals ct
    ORDER BY fp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_users_overview(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_users_overview(text, integer, integer) TO authenticated;
