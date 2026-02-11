-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['user'::text, 'admin'::text]));
    END IF;
END $$;

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject text NOT NULL,
    category text NOT NULL CONSTRAINT support_tickets_category_check CHECK (category = ANY (ARRAY['general'::text, 'bug'::text, 'billing'::text, 'feature_request'::text, 'account'::text])),
    status text DEFAULT 'open' CONSTRAINT support_tickets_status_check CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
    urgency_score integer DEFAULT 0,
    last_bumped_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_created_at_idx ON public.support_tickets(status, created_at);
CREATE INDEX IF NOT EXISTS support_tickets_urgency_created_at_idx ON public.support_tickets(urgency_score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS support_messages_ticket_id_created_at_idx ON public.support_messages(ticket_id, created_at);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Users can create tickets') THEN
        CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Users can view own tickets') THEN
        CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Admins can view all tickets') THEN
        CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Admins can update all tickets') THEN
        CREATE POLICY "Admins can update all tickets" ON public.support_tickets FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
    END IF;
END $$;

-- Remove insecure policy if it already exists in an existing environment
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;

-- Policies for support_messages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'Users can view messages for own tickets') THEN
        CREATE POLICY "Users can view messages for own tickets" ON public.support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'Users can send messages to own tickets') THEN
        CREATE POLICY "Users can send messages to own tickets" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'Admins can view all messages') THEN
        CREATE POLICY "Admins can view all messages" ON public.support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'Admins can send messages') THEN
        CREATE POLICY "Admins can send messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
    END IF;
END $$;

-- Atomic ticket creation (ticket + first message)
CREATE OR REPLACE FUNCTION public.create_support_ticket(
    p_subject text,
    p_category text,
    p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_ticket_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO public.support_tickets (user_id, subject, category, status)
    VALUES (v_user_id, p_subject, p_category, 'open')
    RETURNING id INTO v_ticket_id;

    INSERT INTO public.support_messages (ticket_id, sender_id, message)
    VALUES (v_ticket_id, v_user_id, p_message);

    RETURN v_ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_support_ticket(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(text, text, text) TO authenticated;

-- Controlled urgency bump (enforces ownership + cooldown at DB level)
CREATE OR REPLACE FUNCTION public.bump_support_ticket_urgency(
    p_ticket_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_ticket public.support_tickets%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT *
      INTO v_ticket
      FROM public.support_tickets
     WHERE id = p_ticket_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket not found';
    END IF;

    IF v_ticket.user_id <> v_user_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_ticket.status IN ('resolved', 'closed') THEN
        RAISE EXCEPTION 'Ticket is already closed';
    END IF;

    IF v_ticket.last_bumped_at IS NOT NULL
       AND v_ticket.last_bumped_at > now() - interval '24 hours' THEN
        RAISE EXCEPTION 'You can only bump urgency once every 24 hours.';
    END IF;

    UPDATE public.support_tickets
       SET urgency_score = COALESCE(urgency_score, 0) + 10,
           last_bumped_at = now()
     WHERE id = p_ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.bump_support_ticket_urgency(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_support_ticket_urgency(uuid) TO authenticated;
