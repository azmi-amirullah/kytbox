-- Migration: 20260901_cashflow_book_organization.sql
-- Adds is_pinned, is_archived, updated_at to cashflows and updates cashflow_summaries view

-- 1. Add columns to cashflows
ALTER TABLE public.cashflows
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Add performance index on user_id and is_archived
CREATE INDEX IF NOT EXISTS idx_cashflows_user_archived ON public.cashflows(user_id, is_archived);

-- 3. Drop and recreate view cashflow_summaries to include is_pinned, is_archived, updated_at, and last_entry_at
DROP VIEW IF EXISTS public.cashflow_summaries;

CREATE VIEW public.cashflow_summaries WITH (security_invoker = true) AS
SELECT
  c.id,
  c.user_id,
  c.title,
  c.created_at,
  c.updated_at,
  c.is_public,
  c.is_pinned,
  c.is_archived,
  count(e.id) AS entry_count,
  coalesce(sum(CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END), 0) AS income,
  coalesce(sum(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) AS expense,
  coalesce(sum(CASE WHEN e.type = 'income' THEN e.amount ELSE -e.amount END), 0) AS balance,
  max(e.created_at) AS last_entry_at
FROM
  public.cashflows c
  LEFT JOIN public.cashflow_entries e ON c.id = e.cashflow_id
GROUP BY
  c.id;

-- 4. Grant access to authenticated users
GRANT SELECT ON public.cashflow_summaries TO authenticated;
