-- Add is_public column to cashflows
ALTER TABLE public.cashflows ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create cashflow_shares table
CREATE TABLE IF NOT EXISTS public.cashflow_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cashflow_id uuid REFERENCES public.cashflows(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('read', 'edit')) DEFAULT 'read',
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (cashflow_id, email)
);

-- Add column for persistence (from enable_persistent_preferences)
ALTER TABLE cashflow_shares ADD COLUMN IF NOT EXISTS is_included_in_totals BOOLEAN DEFAULT FALSE;

-- Add column to track how the share was created (from fix_public_share_visibility)
ALTER TABLE cashflow_shares ADD COLUMN IF NOT EXISTS created_via_public_access BOOLEAN DEFAULT FALSE;


-- Enable RLS on cashflow_shares
ALTER TABLE public.cashflow_shares ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies for cashflows
-- ===========================================
DROP POLICY IF EXISTS "Users can view their own cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can view shared or public cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can view shared cashflows" ON cashflows;

CREATE POLICY "Users can view shared or public cashflows" ON public.cashflows
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        is_public = true OR 
        EXISTS (
            SELECT 1 FROM public.cashflow_shares 
            WHERE cashflow_id = public.cashflows.id 
            AND email = (auth.jwt() ->> 'email')
            AND (
              created_via_public_access = false OR  -- Explicit share: always see
              public.cashflows.is_public = true     -- Public subscribe: only see if public
            )
        )
    );

DROP POLICY IF EXISTS "Users can update their own cashflows" ON public.cashflows;
CREATE POLICY "Users can update their own cashflows" ON public.cashflows
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cashflows" ON public.cashflows;
CREATE POLICY "Users can delete their own cashflows" ON public.cashflows
    FOR DELETE
    USING (auth.uid() = user_id);

-- ===========================================
-- RLS Policies for cashflow_entries
-- ===========================================
DROP POLICY IF EXISTS "Users can handle entries of their cashflows" ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can view entries of shared or public cashflows" ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can view entries of accessible cashflows" ON public.cashflow_entries;

CREATE POLICY "Users can view entries of accessible cashflows" ON public.cashflow_entries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cashflows
            WHERE id = cashflow_id AND (
                user_id = auth.uid() OR
                is_public = true OR
                EXISTS (
                    SELECT 1 FROM public.cashflow_shares
                    WHERE cashflow_id = public.cashflow_entries.cashflow_id 
                    AND email = (auth.jwt() ->> 'email')
                    AND (
                      created_via_public_access = false OR
                      public.cashflows.is_public = true
                    )
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage entries with edit role" ON public.cashflow_entries;
CREATE POLICY "Users can manage entries with edit role" ON public.cashflow_entries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.cashflows
            WHERE id = cashflow_id AND (
                user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.cashflow_shares
                    WHERE cashflow_id = public.cashflow_entries.cashflow_id 
                    AND email = (auth.jwt() ->> 'email')
                    AND role = 'edit'
                )
            )
        )
    );

-- ===========================================
-- RLS Policies for cashflow_shares
-- ===========================================
DROP POLICY IF EXISTS "Owners can manage shares" ON public.cashflow_shares;
CREATE POLICY "Owners can manage shares" ON public.cashflow_shares
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.cashflows
            WHERE id = cashflow_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Shared users can view their own shares" ON public.cashflow_shares;
CREATE POLICY "Shared users can view their own shares" ON public.cashflow_shares
    FOR SELECT
    USING (email = (auth.jwt() ->> 'email'));

-- Update shared preferences (from enable_persistent_preferences & fix_bookmark_rls)
DROP POLICY IF EXISTS "Shared users can update their own preferences" ON cashflow_shares;
DROP POLICY IF EXISTS "Users can update their own shares" ON public.cashflow_shares;

CREATE POLICY "Users can update their own shares" ON public.cashflow_shares
    FOR UPDATE
    USING (email = (auth.jwt() ->> 'email'));

-- Subscribe/Unsubscribe logic (from fix_bookmark_rls)
DROP POLICY IF EXISTS "Users can subscribe to public cashflows" ON public.cashflow_shares;
DROP POLICY IF EXISTS "Allow self-subscribe to public cashflows" ON cashflow_shares;

CREATE POLICY "Users can subscribe to public cashflows" ON public.cashflow_shares
    FOR INSERT
    WITH CHECK (
        email = (auth.jwt() ->> 'email') AND 
        EXISTS (
            SELECT 1 FROM public.cashflows 
            WHERE id = cashflow_id AND is_public = true
        )
    );

DROP POLICY IF EXISTS "Users can remove their own shares" ON public.cashflow_shares;
CREATE POLICY "Users can remove their own shares" ON public.cashflow_shares
    FOR DELETE
    USING (email = (auth.jwt() ->> 'email'));
