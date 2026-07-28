-- Squashed local cashflow-goals migration.
-- Rebuilds the final goals schema, authorization, validation trigger, and view.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_cashflow_owner(_cashflow_id uuid)
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
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.is_cashflow_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_cashflow_owner(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.cashflow_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashflow_id uuid NOT NULL REFERENCES public.cashflows(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  deadline date DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

ALTER TABLE public.cashflow_goals
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE public.cashflow_goals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cashflow_goals_cashflow
  ON public.cashflow_goals(cashflow_id);

CREATE INDEX IF NOT EXISTS idx_cashflow_goals_active_cashflow
  ON public.cashflow_goals(cashflow_id)
  WHERE is_deleted = false;

ALTER TABLE public.cashflow_entries
  ADD COLUMN IF NOT EXISTS goal_id uuid
  REFERENCES public.cashflow_goals(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cashflow_entries_goal_id
  ON public.cashflow_entries(goal_id);

DROP POLICY IF EXISTS "Owner manages goals" ON public.cashflow_goals;
DROP POLICY IF EXISTS "Editor reads goals" ON public.cashflow_goals;
DROP POLICY IF EXISTS owner_manages_goals_explicit ON public.cashflow_goals;
DROP POLICY IF EXISTS cashflow_goals_select_accessible ON public.cashflow_goals;
DROP POLICY IF EXISTS cashflow_goals_select_archived_owner ON public.cashflow_goals;
DROP POLICY IF EXISTS cashflow_goals_insert_owner ON public.cashflow_goals;
DROP POLICY IF EXISTS cashflow_goals_update_owner ON public.cashflow_goals;
DROP POLICY IF EXISTS cashflow_goals_delete_owner ON public.cashflow_goals;

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
      AND private.is_cashflow_owner(public.cashflow_goals.cashflow_id)
    )
  );

CREATE POLICY cashflow_goals_insert_owner
  ON public.cashflow_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_deleted = false
    AND private.is_cashflow_owner(cashflow_id)
  );

CREATE POLICY cashflow_goals_update_owner
  ON public.cashflow_goals
  FOR UPDATE
  TO authenticated
  USING (
    is_deleted = false
    AND private.is_cashflow_owner(cashflow_id)
  )
  WITH CHECK (
    private.is_cashflow_owner(cashflow_id)
  );

REVOKE DELETE ON TABLE public.cashflow_goals FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_cashflow_entry_goal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  goal_title text;
BEGIN
  IF NEW.goal_id IS NULL THEN
    IF LEFT(COALESCE(NEW.category, ''), 5) = 'Goal:' THEN
      IF TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'Savings goal entries must reference a savings goal';
      ELSIF OLD.goal_id IS NULL THEN
        RAISE EXCEPTION 'Savings goal entries must reference a savings goal';
      ELSE
        NEW.category := NULL;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  SELECT title
    INTO goal_title
    FROM public.cashflow_goals
   WHERE id = NEW.goal_id
     AND is_deleted = false;

  IF goal_title IS NULL THEN
    RAISE EXCEPTION 'The selected savings goal is not accessible';
  END IF;

  IF NEW.type <> 'expense' THEN
    RAISE EXCEPTION 'Savings goal contributions must be expense entries';
  END IF;

  IF NEW.category IS DISTINCT FROM 'Goal: ' || goal_title THEN
    RAISE EXCEPTION 'Savings goal category does not match the selected goal';
  END IF;

  RETURN NEW;
END;
$function$;

UPDATE public.cashflow_entries
   SET category = NULL
 WHERE goal_id IS NULL
   AND LEFT(COALESCE(category, ''), 5) = 'Goal:';

DROP TRIGGER IF EXISTS cashflow_entry_goal_validation
  ON public.cashflow_entries;

CREATE TRIGGER cashflow_entry_goal_validation
  BEFORE INSERT OR UPDATE OF goal_id, category, type
  ON public.cashflow_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cashflow_entry_goal();

CREATE OR REPLACE VIEW public.cashflow_goal_progress
WITH (security_invoker = true)
AS
SELECT
  g.id AS goal_id,
  g.cashflow_id,
  COALESCE(SUM(e.amount), 0) AS saved_amount,
  COUNT(e.id)::integer AS contribution_count
FROM public.cashflow_goals AS g
LEFT JOIN public.cashflow_entries AS e
  ON e.goal_id = g.id
 AND e.type = 'expense'
WHERE g.is_deleted = false
GROUP BY g.id, g.cashflow_id;

GRANT SELECT ON public.cashflow_goal_progress TO anon, authenticated;
