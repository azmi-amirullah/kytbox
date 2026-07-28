-- Corrective migration for the cashflow security and data-integrity audit.

DO $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cashflow_entries_amount_positive'
      AND conrelid = 'public.cashflow_entries'::regclass
  ) THEN
    ALTER TABLE public.cashflow_entries
      ADD CONSTRAINT cashflow_entries_amount_positive CHECK (amount > 0);
  END IF;
END
$function$;

UPDATE public.cashflow_shares
   SET email = lower(trim(email))
 WHERE email IS DISTINCT FROM lower(trim(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_cashflow_shares_cashflow_lower_email
  ON public.cashflow_shares (cashflow_id, lower(email));

CREATE OR REPLACE FUNCTION public.normalize_cashflow_share_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS normalize_cashflow_share_email
  ON public.cashflow_shares;

CREATE TRIGGER normalize_cashflow_share_email
  BEFORE INSERT OR UPDATE OF email
  ON public.cashflow_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_cashflow_share_email();

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
                COALESCE(public.cashflow_shares.created_via_public_access, false) = false
                OR public.cashflows.is_public = true
              )
          )
        )
    )
  );

CREATE POLICY cashflow_entries_insert_owner_or_editor
  ON public.cashflow_entries
  FOR INSERT
  TO authenticated
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
              AND COALESCE(public.cashflow_shares.created_via_public_access, false) = false
          )
        )
    )
  );

CREATE POLICY cashflow_entries_update_owner_or_editor
  ON public.cashflow_entries
  FOR UPDATE
  TO authenticated
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
              AND COALESCE(public.cashflow_shares.created_via_public_access, false) = false
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
              AND COALESCE(public.cashflow_shares.created_via_public_access, false) = false
          )
        )
    )
  );

CREATE POLICY cashflow_entries_delete_owner_or_editor
  ON public.cashflow_entries
  FOR DELETE
  TO authenticated
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
              AND COALESCE(public.cashflow_shares.created_via_public_access, false) = false
          )
        )
    )
  );

DROP POLICY IF EXISTS cashflow_shares_insert_owner_or_public_member
  ON public.cashflow_shares;
DROP POLICY IF EXISTS cashflow_shares_delete_owner_or_member
  ON public.cashflow_shares;

CREATE POLICY cashflow_shares_insert_owner_or_public_member
  ON public.cashflow_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.is_cashflow_owner(cashflow_id)
    OR (
      LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
      AND role = 'read'
      AND created_via_public_access = true
      AND EXISTS (
        SELECT 1
        FROM public.cashflows
        WHERE public.cashflows.id = public.cashflow_shares.cashflow_id
          AND public.cashflows.is_public = true
      )
    )
  );

CREATE POLICY cashflow_shares_delete_owner_or_member
  ON public.cashflow_shares
  FOR DELETE
  TO authenticated
  USING (
    private.is_cashflow_owner(cashflow_id)
    OR (
      LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
      AND created_via_public_access = true
    )
  );

DROP POLICY IF EXISTS cashflow_budgets_select_owner_or_editor
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
        AND COALESCE(public.cashflow_shares.created_via_public_access, false) = false
    )
  );

UPDATE public.cashflow_entries AS entry
   SET category = 'Goal: ' || goal.title
  FROM public.cashflow_goals AS goal
 WHERE entry.goal_id = goal.id
   AND goal.is_deleted = false
   AND entry.category IS DISTINCT FROM 'Goal: ' || goal.title;

CREATE OR REPLACE FUNCTION public.sync_cashflow_goal_entry_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_deleted = false AND NEW.title IS DISTINCT FROM OLD.title THEN
    UPDATE public.cashflow_entries
       SET category = 'Goal: ' || NEW.title
     WHERE goal_id = NEW.id
       AND category IS DISTINCT FROM 'Goal: ' || NEW.title;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS cashflow_goal_title_category_sync
  ON public.cashflow_goals;

CREATE TRIGGER cashflow_goal_title_category_sync
  AFTER UPDATE OF title
  ON public.cashflow_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_cashflow_goal_entry_categories();
