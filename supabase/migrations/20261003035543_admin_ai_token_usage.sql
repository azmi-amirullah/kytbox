CREATE TABLE public.ai_token_usage_daily (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    usage_date date NOT NULL,
    scan_count bigint NOT NULL DEFAULT 0 CHECK (scan_count >= 0),
    input_tokens bigint NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens bigint NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.ai_token_usage_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_token_usage_daily FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_ai_token_usage(
    p_user_id uuid,
    p_input_tokens bigint,
    p_output_tokens bigint,
    p_scan_count bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_user_id IS NULL
       OR p_input_tokens IS NULL
       OR p_output_tokens IS NULL
       OR p_scan_count IS NULL
       OR p_input_tokens < 0
       OR p_output_tokens < 0
       OR p_scan_count <= 0 THEN
        RAISE EXCEPTION 'Invalid AI usage values';
    END IF;

    INSERT INTO public.ai_token_usage_daily (
        user_id,
        usage_date,
        scan_count,
        input_tokens,
        output_tokens
    )
    VALUES (
        p_user_id,
        (clock_timestamp() AT TIME ZONE 'Asia/Jakarta')::date,
        p_scan_count,
        p_input_tokens,
        p_output_tokens
    )
    ON CONFLICT (user_id, usage_date) DO UPDATE
       SET scan_count = public.ai_token_usage_daily.scan_count + EXCLUDED.scan_count,
           input_tokens = public.ai_token_usage_daily.input_tokens + EXCLUDED.input_tokens,
           output_tokens = public.ai_token_usage_daily.output_tokens + EXCLUDED.output_tokens;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_token_usage(uuid, bigint, bigint, bigint)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_token_usage(uuid, bigint, bigint, bigint)
    TO service_role;

CREATE OR REPLACE FUNCTION public.get_admin_ai_token_usage(
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    username text,
    display_name text,
    avatar_url text,
    email text,
    scan_count bigint,
    input_tokens bigint,
    output_tokens bigint,
    total_count bigint,
    total_scan_count numeric,
    total_input_tokens numeric,
    total_output_tokens numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL OR NOT EXISTS (
        SELECT 1
          FROM public.profiles
         WHERE profiles.id = v_user_id
           AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100
       OR p_offset IS NULL OR p_offset < 0 THEN
        RAISE EXCEPTION 'Invalid pagination values';
    END IF;

    RETURN QUERY
    WITH profile_usage AS (
        SELECT
            p.id,
            p.username,
            p.display_name,
            p.avatar_url,
            au.email::text AS email,
            COALESCE(SUM(u.scan_count), 0)::bigint AS scan_count,
            COALESCE(SUM(u.input_tokens), 0)::bigint AS input_tokens,
            COALESCE(SUM(u.output_tokens), 0)::bigint AS output_tokens
        FROM public.profiles p
        LEFT JOIN public.ai_token_usage_daily u ON u.user_id = p.id
        LEFT JOIN auth.users au ON au.id = p.id
        GROUP BY p.id, p.username, p.display_name, p.avatar_url, au.email
    ),
    totals AS (
        SELECT
            COUNT(*)::bigint AS total_count,
            COALESCE(SUM(pu.scan_count), 0)::numeric AS total_scan_count,
            COALESCE(SUM(pu.input_tokens), 0)::numeric AS total_input_tokens,
            COALESCE(SUM(pu.output_tokens), 0)::numeric AS total_output_tokens
        FROM profile_usage pu
    ),
    page_users AS (
        SELECT pu.*
        FROM profile_usage pu
        ORDER BY pu.scan_count DESC,
                 pu.input_tokens::numeric + pu.output_tokens::numeric DESC,
                 pu.username ASC
        LIMIT p_limit OFFSET p_offset
    )
    SELECT
        page_users.id,
        page_users.username,
        page_users.display_name,
        page_users.avatar_url,
        page_users.email,
        page_users.scan_count,
        page_users.input_tokens,
        page_users.output_tokens,
        totals.total_count,
        totals.total_scan_count,
        totals.total_input_tokens,
        totals.total_output_tokens
    FROM totals
    LEFT JOIN page_users ON true
    ORDER BY page_users.scan_count DESC NULLS LAST,
             page_users.input_tokens::numeric + page_users.output_tokens::numeric DESC NULLS LAST,
             page_users.username ASC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_ai_token_usage(integer, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_ai_token_usage(integer, integer)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_ai_token_usage_history(
    p_user_id uuid,
    p_period text DEFAULT 'daily',
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    username text,
    display_name text,
    avatar_url text,
    email text,
    bucket_date date,
    scan_count bigint,
    input_tokens bigint,
    output_tokens bigint,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL OR NOT EXISTS (
        SELECT 1
          FROM public.profiles
         WHERE profiles.id = v_user_id
           AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF p_user_id IS NULL OR p_period IS NULL OR p_period NOT IN ('daily', 'monthly') THEN
        RAISE EXCEPTION 'Invalid usage history query';
    END IF;

    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100
       OR p_offset IS NULL OR p_offset < 0 THEN
        RAISE EXCEPTION 'Invalid pagination values';
    END IF;

    RETURN QUERY
    WITH target_user AS (
        SELECT
            p.id,
            p.username,
            p.display_name,
            p.avatar_url,
            au.email::text AS email
        FROM public.profiles p
        LEFT JOIN auth.users au ON au.id = p.id
        WHERE p.id = p_user_id
    ),
    history_rows AS (
        SELECT
            CASE
                WHEN p_period = 'daily' THEN u.usage_date
                ELSE date_trunc('month', u.usage_date::timestamp)::date
            END AS bucket_date,
            SUM(u.scan_count)::bigint AS scan_count,
            SUM(u.input_tokens)::bigint AS input_tokens,
            SUM(u.output_tokens)::bigint AS output_tokens
        FROM public.ai_token_usage_daily u
        WHERE u.user_id = p_user_id
        GROUP BY 1
    ),
    totals AS (
        SELECT COUNT(*)::bigint AS total_count
        FROM history_rows
    ),
    page_history AS (
        SELECT hr.*
        FROM history_rows hr
        ORDER BY hr.bucket_date DESC
        LIMIT p_limit OFFSET p_offset
    )
    SELECT
        target_user.id,
        target_user.username,
        target_user.display_name,
        target_user.avatar_url,
        target_user.email,
        page_history.bucket_date,
        page_history.scan_count,
        page_history.input_tokens,
        page_history.output_tokens,
        totals.total_count
    FROM target_user
    CROSS JOIN totals
    LEFT JOIN page_history ON true
    ORDER BY page_history.bucket_date DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_ai_token_usage_history(uuid, text, integer, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_ai_token_usage_history(uuid, text, integer, integer)
    TO authenticated;
