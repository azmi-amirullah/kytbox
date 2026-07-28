-- Squashed local cashflow security migration.
-- Consolidates final RLS policies, grants, trigger hardening, and indexes.

ALTER TABLE public.cashflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can delete own cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can delete their own cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can read own cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can update own cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can update their own cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can view public cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can view shared cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can view shared or public cashflows" ON public.cashflows;
DROP POLICY IF EXISTS "Users can view their own cashflows" ON public.cashflows;
DROP POLICY IF EXISTS cashflows_insert_owner ON public.cashflows;
DROP POLICY IF EXISTS cashflows_select_accessible ON public.cashflows;
DROP POLICY IF EXISTS cashflows_update_owner ON public.cashflows;
DROP POLICY IF EXISTS cashflows_delete_owner ON public.cashflows;

CREATE POLICY cashflows_insert_owner
  ON public.cashflows
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY cashflows_select_accessible
  ON public.cashflows
  FOR SELECT
  TO public
  USING (
    is_public = true
    OR user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.cashflow_shares
      WHERE public.cashflow_shares.cashflow_id = public.cashflows.id
        AND LOWER(public.cashflow_shares.email) =
            LOWER((SELECT auth.jwt()) ->> 'email')
        AND (
          COALESCE(public.cashflow_shares.created_via_public_access, false) = false
          OR public.cashflows.is_public = true
        )
    )
  );

CREATE POLICY cashflows_update_owner
  ON public.cashflows
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY cashflows_delete_owner
  ON public.cashflows
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own cashflow entries"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can delete own cashflow entries"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can manage entries if editor"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can manage entries if owner"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can manage entries with edit role"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can read own cashflow entries"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can update own cashflow entries"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can view entries of accessible cashflows"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can handle entries of their cashflows"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS "Users can view entries of shared or public cashflows"
  ON public.cashflow_entries;
DROP POLICY IF EXISTS cashflow_entries_select_accessible
  ON public.cashflow_entries;
DROP POLICY IF EXISTS cashflow_entries_insert_owner_or_editor
  ON public.cashflow_entries;
DROP POLICY IF EXISTS cashflow_entries_update_owner_or_editor
  ON public.cashflow_entries;
DROP POLICY IF EXISTS cashflow_entries_delete_owner_or_editor
  ON public.cashflow_entries;

CREATE POLICY cashflow_entries_select_accessible
  ON public.cashflow_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_entries.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR public.cashflows.is_public = true
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_entries.cashflow_id
              AND LOWER(public.cashflow_shares.email) =
                    LOWER((SELECT auth.jwt()) ->> 'email')
              AND (
                public.cashflow_shares.created_via_public_access = false
                OR public.cashflows.is_public = true
                OR public.cashflow_shares.role = 'edit'
              )
          )
        )
    )
  );

CREATE POLICY cashflow_entries_insert_owner_or_editor
  ON public.cashflow_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_entries.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_entries.cashflow_id
              AND LOWER(public.cashflow_shares.email) =
                    LOWER((SELECT auth.jwt()) ->> 'email')
              AND public.cashflow_shares.role = 'edit'
          )
        )
    )
  );

CREATE POLICY cashflow_entries_update_owner_or_editor
  ON public.cashflow_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_entries.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_entries.cashflow_id
              AND LOWER(public.cashflow_shares.email) =
                    LOWER((SELECT auth.jwt()) ->> 'email')
              AND public.cashflow_shares.role = 'edit'
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_entries.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_entries.cashflow_id
              AND LOWER(public.cashflow_shares.email) =
                    LOWER((SELECT auth.jwt()) ->> 'email')
              AND public.cashflow_shares.role = 'edit'
          )
        )
    )
  );

CREATE POLICY cashflow_entries_delete_owner_or_editor
  ON public.cashflow_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_entries.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_entries.cashflow_id
              AND LOWER(public.cashflow_shares.email) =
                    LOWER((SELECT auth.jwt()) ->> 'email')
              AND public.cashflow_shares.role = 'edit'
          )
        )
    )
  );

DROP POLICY IF EXISTS "Allow self-subscribe to public cashflows"
  ON public.cashflow_shares;
DROP POLICY IF EXISTS "Owners can manage shares"
  ON public.cashflow_shares;
DROP POLICY IF EXISTS "Shared users can update their own preferences"
  ON public.cashflow_shares;
DROP POLICY IF EXISTS "Shared users can view their own shares"
  ON public.cashflow_shares;
DROP POLICY IF EXISTS "Users can remove their own shares"
  ON public.cashflow_shares;
DROP POLICY IF EXISTS "Users can subscribe to public cashflows"
  ON public.cashflow_shares;
DROP POLICY IF EXISTS "Users can update their own shares"
  ON public.cashflow_shares;
DROP POLICY IF EXISTS cashflow_shares_select_owner_or_member
  ON public.cashflow_shares;
DROP POLICY IF EXISTS cashflow_shares_insert_owner_or_public_member
  ON public.cashflow_shares;
DROP POLICY IF EXISTS cashflow_shares_update_owner_or_member
  ON public.cashflow_shares;
DROP POLICY IF EXISTS cashflow_shares_delete_owner_or_member
  ON public.cashflow_shares;

DROP FUNCTION IF EXISTS public.is_cashflow_owner(uuid);

CREATE POLICY cashflow_shares_select_owner_or_member
  ON public.cashflow_shares
  FOR SELECT
  TO authenticated
  USING (
    private.is_cashflow_owner(cashflow_id)
    OR LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
  );

CREATE POLICY cashflow_shares_insert_owner_or_public_member
  ON public.cashflow_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.is_cashflow_owner(cashflow_id)
    OR (
      LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
      AND EXISTS (
        SELECT 1
        FROM public.cashflows
        WHERE public.cashflows.id = public.cashflow_shares.cashflow_id
          AND public.cashflows.is_public = true
      )
    )
  );

CREATE POLICY cashflow_shares_update_owner_or_member
  ON public.cashflow_shares
  FOR UPDATE
  TO authenticated
  USING (
    private.is_cashflow_owner(cashflow_id)
    OR LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
  )
  WITH CHECK (
    private.is_cashflow_owner(cashflow_id)
    OR LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
  );

CREATE POLICY cashflow_shares_delete_owner_or_member
  ON public.cashflow_shares
  FOR DELETE
  TO authenticated
  USING (
    private.is_cashflow_owner(cashflow_id)
    OR LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
  );

DROP POLICY IF EXISTS "Editors can read budgets"
  ON public.cashflow_budgets;
DROP POLICY IF EXISTS "Owner can manage budgets"
  ON public.cashflow_budgets;
DROP POLICY IF EXISTS cashflow_budgets_select_owner_or_editor
  ON public.cashflow_budgets;
DROP POLICY IF EXISTS cashflow_budgets_insert_owner
  ON public.cashflow_budgets;
DROP POLICY IF EXISTS cashflow_budgets_update_owner
  ON public.cashflow_budgets;
DROP POLICY IF EXISTS cashflow_budgets_delete_owner
  ON public.cashflow_budgets;

CREATE POLICY cashflow_budgets_select_owner_or_editor
  ON public.cashflow_budgets
  FOR SELECT
  TO authenticated
  USING (
    private.is_cashflow_owner(cashflow_id)
    OR EXISTS (
      SELECT 1
      FROM public.cashflow_shares
      WHERE public.cashflow_shares.cashflow_id =
            public.cashflow_budgets.cashflow_id
        AND LOWER(public.cashflow_shares.email) =
            LOWER((SELECT auth.jwt()) ->> 'email')
        AND public.cashflow_shares.role = 'edit'
    )
  );

CREATE POLICY cashflow_budgets_insert_owner
  ON public.cashflow_budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_cashflow_owner(cashflow_id));

CREATE POLICY cashflow_budgets_update_owner
  ON public.cashflow_budgets
  FOR UPDATE
  TO authenticated
  USING (private.is_cashflow_owner(cashflow_id))
  WITH CHECK (private.is_cashflow_owner(cashflow_id));

CREATE POLICY cashflow_budgets_delete_owner
  ON public.cashflow_budgets
  FOR DELETE
  TO authenticated
  USING (private.is_cashflow_owner(cashflow_id));

CREATE OR REPLACE FUNCTION public.check_cashflow_share_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role)
     OR (NEW.created_via_public_access IS DISTINCT FROM OLD.created_via_public_access)
     OR (NEW.cashflow_id IS DISTINCT FROM OLD.cashflow_id)
     OR (NEW.email IS DISTINCT FROM OLD.email) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE id = NEW.cashflow_id
        AND user_id = (SELECT auth.uid())
    ) THEN
      RAISE EXCEPTION
        'Access Denied: Only the cashflow owner can modify role, email, or access flags.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE INDEX IF NOT EXISTS idx_cashflow_shares_lower_email
  ON public.cashflow_shares (LOWER(email));

