-- Migration: Cashflow Week 2 Power Features
-- Date: 2026-09-08
-- Description:
--   1. Day 9: Budget Rollover & Envelope Allocation (enable_rollover on cashflow_budgets)
--   2. Day 10: Multi-Currency Support (original_currency, original_amount, exchange_rate on cashflow_entries)
--   3. Day 11: Zero-Signup Shared Expense Links (cashflow_split_groups & cashflow_split_group_expenses)

-- 1. Day 9: Add enable_rollover to cashflow_budgets
ALTER TABLE public.cashflow_budgets
  ADD COLUMN IF NOT EXISTS enable_rollover boolean NOT NULL DEFAULT false;

-- 2. Day 10: Multi-currency support on cashflow_entries
ALTER TABLE public.cashflow_entries
  ADD COLUMN IF NOT EXISTS original_currency text,
  ADD COLUMN IF NOT EXISTS original_amount numeric,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric NOT NULL DEFAULT 1.0;

-- 3. Day 11: Zero-signup split expense groups
CREATE TABLE IF NOT EXISTS public.cashflow_split_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  title text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  pin_hash text,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_split_groups_token ON public.cashflow_split_groups(token);
CREATE INDEX IF NOT EXISTS idx_split_groups_creator ON public.cashflow_split_groups(creator_id);

ALTER TABLE public.cashflow_split_groups ENABLE ROW LEVEL SECURITY;

-- Allow public read access to split groups (anyone with the link/token can view)
CREATE POLICY "Public read split groups"
  ON public.cashflow_split_groups
  FOR SELECT
  USING (true);

-- Allow authenticated users or guests to create split groups
CREATE POLICY "Allow create split groups"
  ON public.cashflow_split_groups
  FOR INSERT
  WITH CHECK (true);

-- Allow creator or authenticated user to update their split groups
CREATE POLICY "Allow update split groups"
  ON public.cashflow_split_groups
  FOR UPDATE
  USING (creator_id IS NULL OR creator_id = auth.uid());

-- 4. Day 11: Shared group expenses
CREATE TABLE IF NOT EXISTS public.cashflow_split_group_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.cashflow_split_groups(id) ON DELETE CASCADE NOT NULL,
  device_token text NOT NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  paid_by text NOT NULL,
  split_between text[] NOT NULL,
  is_settlement boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_split_expenses_group ON public.cashflow_split_group_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_split_expenses_created_at ON public.cashflow_split_group_expenses(created_at DESC);

ALTER TABLE public.cashflow_split_group_expenses ENABLE ROW LEVEL SECURITY;

-- Allow reading expenses belonging to accessible split groups
CREATE POLICY "Public read split expenses"
  ON public.cashflow_split_group_expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cashflow_split_groups g
      WHERE g.id = cashflow_split_group_expenses.group_id
    )
  );

-- Allow inserting split expenses to valid groups
CREATE POLICY "Public insert split expenses"
  ON public.cashflow_split_group_expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cashflow_split_groups g
      WHERE g.id = cashflow_split_group_expenses.group_id
    )
  );

-- Allow updating split expenses
CREATE POLICY "Public update split expenses"
  ON public.cashflow_split_group_expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cashflow_split_groups g
      WHERE g.id = cashflow_split_group_expenses.group_id
    )
  );

-- Allow deleting split expenses
CREATE POLICY "Public delete split expenses"
  ON public.cashflow_split_group_expenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cashflow_split_groups g
      WHERE g.id = cashflow_split_group_expenses.group_id
    )
  );
