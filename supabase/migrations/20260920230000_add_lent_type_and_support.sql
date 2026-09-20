-- Migration: Add 'lent' type to cashflow_goals and update triggers and views
-- Extends cashflow_goals with 'lent' support for tracking money lent to others (repaid via income entries).

-- 1. Update check constraint on cashflow_goals
ALTER TABLE public.cashflow_goals
  DROP CONSTRAINT IF EXISTS cashflow_goals_type_check;

ALTER TABLE public.cashflow_goals
  ADD CONSTRAINT cashflow_goals_type_check
  CHECK (type IN ('savings', 'debt', 'lent'));

-- 2. Update validate_cashflow_entry_goal() function
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
    IF LEFT(COALESCE(NEW.category, ''), 5) = 'Goal:' 
       OR LEFT(COALESCE(NEW.category, ''), 5) = 'Debt:' 
       OR LEFT(COALESCE(NEW.category, ''), 5) = 'Lent:' THEN
      IF TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'Target contributions must reference an active goal, debt, or lent target';
      ELSIF OLD.goal_id IS NULL THEN
        RAISE EXCEPTION 'Target contributions must reference an active goal, debt, or lent target';
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
    RAISE EXCEPTION 'The selected target is not accessible';
  END IF;

  -- Validate entry type based on target type
  IF target_type = 'lent' THEN
    IF NEW.type <> 'income' THEN
      RAISE EXCEPTION 'Lent repayments must be income entries';
    END IF;
  ELSIF target_type IN ('savings', 'debt') THEN
    IF NEW.type <> 'expense' THEN
      RAISE EXCEPTION 'Goal and debt contributions must be expense entries';
    END IF;
  END IF;

  -- Verify category matches target title with appropriate prefix
  IF target_type = 'lent' THEN
    IF NEW.category IS DISTINCT FROM 'Lent: ' || target_title
       AND NEW.category IS DISTINCT FROM 'Lent:' || target_title THEN
      RAISE EXCEPTION 'Entry category does not match the selected target';
    END IF;
  ELSIF target_type = 'debt' THEN
    IF NEW.category IS DISTINCT FROM 'Debt: ' || target_title
       AND NEW.category IS DISTINCT FROM 'Debt:' || target_title THEN
      RAISE EXCEPTION 'Entry category does not match the selected target';
    END IF;
  ELSE
    IF NEW.category IS DISTINCT FROM 'Goal: ' || target_title
       AND NEW.category IS DISTINCT FROM 'Goal:' || target_title THEN
      RAISE EXCEPTION 'Entry category does not match the selected target';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Update cashflow_goal_progress view
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
 AND (
   (g.type IN ('savings', 'debt') AND e.type = 'expense')
   OR (g.type = 'lent' AND e.type = 'income')
 )
WHERE g.is_deleted = false
GROUP BY g.id, g.cashflow_id, g.initial_amount;
