-- Mark counterpart messages as read when viewing a support thread.
CREATE OR REPLACE FUNCTION public.mark_support_messages_read(
    p_ticket_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_ticket_user_id uuid;
    v_is_admin boolean;
    v_updated_count integer;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT t.user_id
      INTO v_ticket_user_id
      FROM public.support_tickets t
     WHERE t.id = p_ticket_id;

    IF v_ticket_user_id IS NULL THEN
        RAISE EXCEPTION 'Ticket not found';
    END IF;

    SELECT EXISTS (
        SELECT 1
          FROM public.profiles p
         WHERE p.id = v_user_id
           AND p.role = 'admin'
    )
      INTO v_is_admin;

    IF NOT v_is_admin AND v_ticket_user_id <> v_user_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_is_admin THEN
        UPDATE public.support_messages
           SET read_at = now()
         WHERE ticket_id = p_ticket_id
           AND sender_id = v_ticket_user_id
           AND read_at IS NULL;
    ELSE
        UPDATE public.support_messages
           SET read_at = now()
         WHERE ticket_id = p_ticket_id
           AND sender_id <> v_user_id
           AND read_at IS NULL;
    END IF;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_support_messages_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_support_messages_read(uuid) TO authenticated;
