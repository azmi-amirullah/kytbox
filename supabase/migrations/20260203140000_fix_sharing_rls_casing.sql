-- Fix case sensitivity in sharing policies
-- And allow invited users to see/edit regardless of casing

-- 1. Update cashflows view policy
DROP POLICY IF EXISTS "Users can view shared or public cashflows" ON public.cashflows;
CREATE POLICY "Users can view shared or public cashflows" ON public.cashflows
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        is_public = true OR 
        EXISTS (
            SELECT 1 FROM public.cashflow_shares 
            WHERE cashflow_id = public.cashflows.id 
            AND LOWER(email) = LOWER(auth.jwt() ->> 'email')
            AND (
              created_via_public_access = false OR
              public.cashflows.is_public = true
            )
        )
    );

-- 2. Update cashflow_entries view policy
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
                    AND LOWER(email) = LOWER(auth.jwt() ->> 'email')
                    AND (
                      created_via_public_access = false OR
                      public.cashflows.is_public = true
                    )
                )
            )
        )
    );

-- 3. Update cashflow_entries management policy
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
                    AND LOWER(email) = LOWER(auth.jwt() ->> 'email')
                    AND role = 'edit'
                )
            )
        )
    );

-- 4. Update cashflow_shares self-view policy
DROP POLICY IF EXISTS "Shared users can view their own shares" ON public.cashflow_shares;
CREATE POLICY "Shared users can view their own shares" ON public.cashflow_shares
    FOR SELECT
    USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- 5. Update cashflow_shares self-update policy
DROP POLICY IF EXISTS "Users can update their own shares" ON public.cashflow_shares;
CREATE POLICY "Users can update their own shares" ON public.cashflow_shares
    FOR UPDATE
    USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- 6. Update cashflow_shares self-insert policy (Subscribe)
DROP POLICY IF EXISTS "Users can subscribe to public cashflows" ON public.cashflow_shares;
CREATE POLICY "Users can subscribe to public cashflows" ON public.cashflow_shares
    FOR INSERT
    WITH CHECK (
        LOWER(email) = LOWER(auth.jwt() ->> 'email') AND 
        EXISTS (
            SELECT 1 FROM public.cashflows 
            WHERE id = cashflow_id AND is_public = true
        )
    );

-- 7. Update cashflow_shares self-delete policy (Unsubscribe)
DROP POLICY IF EXISTS "Users can remove their own shares" ON public.cashflow_shares;
CREATE POLICY "Users can remove their own shares" ON public.cashflow_shares
    FOR DELETE
    USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));
