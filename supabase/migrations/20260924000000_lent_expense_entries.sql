-- Migration: Allow expense entries on lent targets and grow Total Lent from them
-- A lent target now accepts both entry types:
--   * expense = new money lent out, which increases "Total Lent"
--   * income  = repayment collected, which increases "Total Collected" (unchanged)

-- 1. Update validate_cashflow_entry_goal() so lent targets accept income and expense
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

  -- Validate entry type based on target type.
  -- Lent targets accept both: income (repayment collected) and expense (new money lent out).
  IF target_type IN ('savings', 'debt') THEN
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

-- 2. Update cashflow_goal_progress view
--    * saved_amount keeps its meaning: initial + repayments collected (lent) or initial + expenses (savings/debt)
--    * target_amount is now computed for lent targets: stored target + linked expense entries
--    * contribution_count covers every linked entry (for lent: repayments and new lending)
CREATE OR REPLACE VIEW public.cashflow_goal_progress
WITH (security_invoker = true)
AS
SELECT
  g.id AS goal_id,
  g.cashflow_id,
  COALESCE(g.initial_amount, 0) + COALESCE(SUM(
    CASE
      WHEN g.type = 'lent' THEN CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END
      ELSE e.amount
    END
  ), 0) AS saved_amount,
  COUNT(e.id)::integer AS contribution_count,
  CASE
    WHEN g.type = 'lent' THEN
      COALESCE(g.target_amount, 0) + COALESCE(SUM(
        CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END
      ), 0)
    ELSE g.target_amount
  END AS target_amount
FROM public.cashflow_goals AS g
LEFT JOIN public.cashflow_entries AS e
  ON e.goal_id = g.id
 AND (
   (g.type IN ('savings', 'debt') AND e.type = 'expense')
   OR (g.type = 'lent' AND e.type IN ('income', 'expense'))
 )
WHERE g.is_deleted = false
GROUP BY g.id, g.cashflow_id, g.initial_amount, g.target_amount, g.type;
