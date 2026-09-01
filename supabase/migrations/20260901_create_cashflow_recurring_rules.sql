-- Migration: Create cashflow_recurring_rules table and link entries
-- Date: 2026-09-01
-- Description: First-class Blueprint & Instance model for recurring cashflow transactions.

-- 1. Create table for recurring transaction rules (Blueprint)
CREATE TABLE IF NOT EXISTS public.cashflow_recurring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashflow_id uuid NOT NULL REFERENCES public.cashflows(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text,
  goal_id uuid REFERENCES public.cashflow_goals(id) ON DELETE SET NULL,
  recurrence_interval text NOT NULL DEFAULT 'monthly' CHECK (recurrence_interval IN ('monthly', 'yearly')),
  yearly_calculation text CHECK (yearly_calculation IN ('prorated', 'exact')),
  day_of_month integer NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 31),
  is_active boolean NOT NULL DEFAULT true,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add recurring_rule_id foreign key to cashflow_entries (Instance)
ALTER TABLE public.cashflow_entries
  ADD COLUMN IF NOT EXISTS recurring_rule_id uuid REFERENCES public.cashflow_recurring_rules(id) ON DELETE SET NULL;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_cashflow_recurring_rules_cashflow_id 
  ON public.cashflow_recurring_rules(cashflow_id);

CREATE INDEX IF NOT EXISTS idx_cashflow_recurring_rules_active 
  ON public.cashflow_recurring_rules(cashflow_id, is_active);

CREATE INDEX IF NOT EXISTS idx_cashflow_entries_recurring_rule_id 
  ON public.cashflow_entries(recurring_rule_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.cashflow_recurring_rules ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for cashflow_recurring_rules
CREATE POLICY cashflow_recurring_rules_select_accessible
  ON public.cashflow_recurring_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_recurring_rules.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR public.cashflows.is_public = true
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_recurring_rules.cashflow_id
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

CREATE POLICY cashflow_recurring_rules_insert_owner_or_editor
  ON public.cashflow_recurring_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_recurring_rules.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_recurring_rules.cashflow_id
              AND LOWER(public.cashflow_shares.email) =
                    LOWER((SELECT auth.jwt()) ->> 'email')
              AND public.cashflow_shares.role = 'edit'
              AND COALESCE(public.cashflow_shares.created_via_public_access, false) = false
          )
        )
    )
  );

CREATE POLICY cashflow_recurring_rules_update_owner_or_editor
  ON public.cashflow_recurring_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_recurring_rules.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_recurring_rules.cashflow_id
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
      WHERE public.cashflows.id = public.cashflow_recurring_rules.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_recurring_rules.cashflow_id
              AND LOWER(public.cashflow_shares.email) =
                    LOWER((SELECT auth.jwt()) ->> 'email')
              AND public.cashflow_shares.role = 'edit'
              AND COALESCE(public.cashflow_shares.created_via_public_access, false) = false
          )
        )
    )
  );

CREATE POLICY cashflow_recurring_rules_delete_owner_or_editor
  ON public.cashflow_recurring_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cashflows
      WHERE public.cashflows.id = public.cashflow_recurring_rules.cashflow_id
        AND (
          public.cashflows.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.cashflow_shares
            WHERE public.cashflow_shares.cashflow_id =
                    public.cashflow_recurring_rules.cashflow_id
              AND LOWER(public.cashflow_shares.email) =
                    LOWER((SELECT auth.jwt()) ->> 'email')
              AND public.cashflow_shares.role = 'edit'
              AND COALESCE(public.cashflow_shares.created_via_public_access, false) = false
          )
        )
    )
  );

-- 6. Backfill existing active recurring items into cashflow_recurring_rules
DO $$
DECLARE
  r RECORD;
  new_rule_id uuid;
BEGIN
  FOR r IN
    WITH ranked AS (
      SELECT 
        id,
        cashflow_id,
        description,
        amount,
        type,
        category,
        goal_id,
        COALESCE(recurrence_interval, 'monthly') as recurrence_interval,
        yearly_calculation,
        EXTRACT(DAY FROM date)::integer as day_of_month,
        date as start_date,
        is_recurring,
        ROW_NUMBER() OVER (
          PARTITION BY cashflow_id, LOWER(TRIM(description)), type 
          ORDER BY date DESC, created_at DESC
        ) as rn
      FROM public.cashflow_entries
    ),
    earliest AS (
      SELECT 
        cashflow_id, 
        LOWER(TRIM(description)) as l_desc, 
        type, 
        MIN(date) as min_date
      FROM public.cashflow_entries
      GROUP BY cashflow_id, LOWER(TRIM(description)), type
    )
    SELECT 
      ranked.cashflow_id,
      ranked.description,
      ranked.amount,
      ranked.type,
      ranked.category,
      ranked.goal_id,
      ranked.recurrence_interval,
      ranked.yearly_calculation,
      ranked.day_of_month,
      COALESCE(earliest.min_date, ranked.start_date) as start_date
    FROM ranked
    JOIN earliest ON earliest.cashflow_id = ranked.cashflow_id 
      AND earliest.l_desc = LOWER(TRIM(ranked.description)) 
      AND earliest.type = ranked.type
    WHERE ranked.rn = 1 AND ranked.is_recurring = true
  LOOP
    INSERT INTO public.cashflow_recurring_rules (
      cashflow_id,
      description,
      amount,
      type,
      category,
      goal_id,
      recurrence_interval,
      yearly_calculation,
      day_of_month,
      is_active,
      start_date
    ) VALUES (
      r.cashflow_id,
      r.description,
      r.amount,
      r.type,
      r.category,
      r.goal_id,
      r.recurrence_interval,
      r.yearly_calculation,
      r.day_of_month,
      true,
      r.start_date
    ) RETURNING id INTO new_rule_id;

    UPDATE public.cashflow_entries
    SET recurring_rule_id = new_rule_id
    WHERE cashflow_id = r.cashflow_id
      AND LOWER(TRIM(description)) = LOWER(TRIM(r.description))
      AND type = r.type
      AND is_recurring = true;
  END LOOP;
END $$;

-- 7. Replace legacy string unique index with recurring_rule_id index
DROP INDEX IF EXISTS unique_recurring_monthly_entry;

CREATE INDEX IF NOT EXISTS idx_cashflow_entries_rule_date 
ON public.cashflow_entries (
  recurring_rule_id, 
  date
) 
WHERE recurring_rule_id IS NOT NULL;
