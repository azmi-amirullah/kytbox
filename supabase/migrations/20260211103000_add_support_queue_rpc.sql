-- Admin queue RPC: compute age and total urgency dynamically from created_at.
CREATE OR REPLACE FUNCTION public.get_support_ticket_queue()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    subject text,
    category text,
    status text,
    urgency_score integer,
    last_bumped_at timestamp with time zone,
    created_at timestamp with time zone,
    age_days integer,
    total_urgency integer,
    username text,
    avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
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

    RETURN QUERY
    WITH scored_tickets AS (
        SELECT
            t.id,
            t.user_id,
            t.subject,
            t.category,
            t.status,
            COALESCE(t.urgency_score, 0)::integer AS urgency_score,
            t.last_bumped_at,
            t.created_at,
            GREATEST(
                0,
                FLOOR(EXTRACT(EPOCH FROM (now() - t.created_at)) / 86400)
            )::integer AS age_days,
            p.username,
            p.avatar_url
        FROM public.support_tickets t
        LEFT JOIN public.profiles p ON p.id = t.user_id
    )
    SELECT
        st.id,
        st.user_id,
        st.subject,
        st.category,
        st.status,
        st.urgency_score,
        st.last_bumped_at,
        st.created_at,
        st.age_days,
        (st.urgency_score + st.age_days)::integer AS total_urgency,
        st.username,
        st.avatar_url
    FROM scored_tickets st
    ORDER BY (st.urgency_score + st.age_days) DESC, st.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_support_ticket_queue() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_support_ticket_queue() TO authenticated;
