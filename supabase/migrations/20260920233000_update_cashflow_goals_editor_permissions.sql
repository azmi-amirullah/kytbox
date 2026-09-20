-- Migration: Update cashflow_goals permissions for shared editors and owners
-- 1. Shared editors can create, edit, archive (soft-delete), and restore targets.
-- 2. Shared editors can view archived targets.
-- 3. Only cashflow owners can permanently delete targets, and only when archived.

CREATE OR REPLACE FUNCTION private.can_edit_cashflow(_cashflow_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.cashflows
    WHERE id = _cashflow_id
      AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM public.cashflow_shares
    WHERE cashflow_id = _cashflow_id
      AND LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
      AND role = 'edit'
      AND COALESCE(created_via_public_access, false) = false
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.can_edit_cashflow(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_edit_cashflow(uuid) TO authenticated;

-- 1. Allow editors to view archived targets as well as active targets
DROP POLICY IF EXISTS cashflow_goals_select_accessible ON public.cashflow_goals;

CREATE POLICY cashflow_goals_select_accessible
  ON public.cashflow_goals
  FOR SELECT
  TO authenticated
  USING (
    (
      is_deleted = false
      AND (
        EXISTS (
          SELECT 1
          FROM public.cashflows
          WHERE public.cashflows.id = public.cashflow_goals.cashflow_id
            AND public.cashflows.user_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.cashflow_shares
          JOIN public.cashflows
            ON public.cashflows.id = public.cashflow_shares.cashflow_id
          WHERE public.cashflow_shares.cashflow_id =
                public.cashflow_goals.cashflow_id
            AND LOWER(public.cashflow_shares.email) =
                LOWER((SELECT auth.jwt()) ->> 'email')
            AND public.cashflow_shares.role IN ('read', 'edit')
            AND COALESCE(
              public.cashflow_shares.created_via_public_access,
              false
            ) = false
        )
      )
    )
    OR (
      is_deleted = true
      AND private.can_edit_cashflow(public.cashflow_goals.cashflow_id)
    )
  );

-- 2. Allow editors to create new targets
DROP POLICY IF EXISTS cashflow_goals_insert_owner ON public.cashflow_goals;
DROP POLICY IF EXISTS cashflow_goals_insert_editor ON public.cashflow_goals;

CREATE POLICY cashflow_goals_insert_editor
  ON public.cashflow_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_deleted = false
    AND private.can_edit_cashflow(cashflow_id)
  );

-- 3. Allow editors to update targets (including archiving and restoring)
DROP POLICY IF EXISTS cashflow_goals_update_owner ON public.cashflow_goals;
DROP POLICY IF EXISTS cashflow_goals_update_editor ON public.cashflow_goals;

CREATE POLICY cashflow_goals_update_editor
  ON public.cashflow_goals
  FOR UPDATE
  TO authenticated
  USING (
    private.can_edit_cashflow(cashflow_id)
  )
  WITH CHECK (
    private.can_edit_cashflow(cashflow_id)
  );

-- 4. Grant DELETE on cashflow_goals to authenticated, but restrict strictly to owners on archived targets
GRANT DELETE ON TABLE public.cashflow_goals TO authenticated;

DROP POLICY IF EXISTS cashflow_goals_delete_owner ON public.cashflow_goals;

CREATE POLICY cashflow_goals_delete_owner
  ON public.cashflow_goals
  FOR DELETE
  TO authenticated
  USING (
    is_deleted = true
    AND private.is_cashflow_owner(cashflow_id)
  );
