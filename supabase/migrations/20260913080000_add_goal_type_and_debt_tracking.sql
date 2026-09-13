-- Migration: Add goal type (savings vs debt) and debt tracking support
-- Extends cashflow_goals with a type column and updates entry validation triggers.

ALTER TABLE public.cashflow_goals
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'savings'
  CHECK (type IN ('savings', 'debt'));

ALTER TABLE public.cashflow_goals
  ADD COLUMN IF NOT EXISTS initial_amount numeric NOT NULL DEFAULT 0
  CHECK (initial_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_cashflow_goals_cashflow_type
  ON public.cashflow_goals (cashflow_id, type)
  WHERE is_deleted = false;

CREATE OR REPLACE FUNCTION public.validate_cashflow_entry_goal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  target_title text;
  target_type text;
BEGIN
  IF NEW.goal_id IS NULL THEN
    IF LEFT(COALESCE(NEW.category, ''), 5) = 'Goal:' OR LEFT(COALESCE(NEW.category, ''), 5) = 'Debt:' THEN
      IF TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'Target contributions must reference an active goal or debt target';
      ELSIF OLD.goal_id IS NULL THEN
        RAISE EXCEPTION 'Target contributions must reference an active goal or debt target';
      ELSE
        NEW.category := NULL;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  SELECT title, type
    INTO target_title, target_type
    FROM public.cashflow_goals
   WHERE id = NEW.goal_id
     AND is_deleted = false;

  IF target_title IS NULL THEN
    RAISE EXCEPTION 'The selected goal or debt target is not accessible';
  END IF;

  IF NEW.type <> 'expense' THEN
    RAISE EXCEPTION 'Goal and debt contributions must be expense entries';
  END IF;

  -- Verify category matches target title with Debt: or Goal: prefix
  IF NEW.category IS DISTINCT FROM (CASE WHEN target_type = 'debt' THEN 'Debt: ' ELSE 'Goal: ' END) || target_title
     AND NEW.category IS DISTINCT FROM 'Goal: ' || target_title
     AND NEW.category IS DISTINCT FROM 'Debt: ' || target_title THEN
    RAISE EXCEPTION 'Entry category does not match the selected target';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE VIEW public.cashflow_goal_progress
WITH (security_invoker = true)
AS
SELECT
  g.id AS goal_id,
  g.cashflow_id,
  COALESCE(g.initial_amount, 0) + COALESCE(SUM(e.amount), 0) AS saved_amount,
  COUNT(e.id)::integer AS contribution_count
FROM public.cashflow_goals AS g
LEFT JOIN public.cashflow_entries AS e
  ON e.goal_id = g.id
 AND e.type = 'expense'
WHERE g.is_deleted = false
GROUP BY g.id, g.cashflow_id, g.initial_amount;

