-- Migration: Create cashflow_audit_logs table
-- Date: 2026-09-30
-- Description: Append-only audit trail and activity feed for collaborative cashflow books.

CREATE TABLE IF NOT EXISTS public.cashflow_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashflow_id uuid REFERENCES public.cashflows(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_name text,
  action text NOT NULL, -- 'create_entry' | 'update_entry' | 'delete_entry' | 'create_budget' | 'update_budget' | 'delete_budget' | 'bulk_delete'
  entity_type text NOT NULL, -- 'entry' | 'budget' | 'share' | 'goal'
  entity_id text,
  description text NOT NULL,
  diff_summary jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cashflow_audit_logs_cashflow_created 
  ON public.cashflow_audit_logs(cashflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashflow_audit_logs_actor 
  ON public.cashflow_audit_logs(actor_id);

ALTER TABLE public.cashflow_audit_logs ENABLE ROW LEVEL SECURITY;

-- Owner can read all audit logs for their books
CREATE POLICY "Owner can read cashflow audit logs"
  ON public.cashflow_audit_logs
  FOR SELECT
  USING (
    cashflow_id IN (SELECT id FROM public.cashflows WHERE user_id = auth.uid())
  );

-- Explicit collaborators (read or edit) can read audit logs
CREATE POLICY "Collaborators can read cashflow audit logs"
  ON public.cashflow_audit_logs
  FOR SELECT
  USING (
    cashflow_id IN (
      SELECT cashflow_id FROM public.cashflow_shares
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Editors and owners can insert audit logs
CREATE POLICY "Editors and owners can insert cashflow audit logs"
  ON public.cashflow_audit_logs
  FOR INSERT
  WITH CHECK (
    cashflow_id IN (SELECT id FROM public.cashflows WHERE user_id = auth.uid())
    OR cashflow_id IN (
      SELECT cashflow_id FROM public.cashflow_shares
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role = 'edit'
    )
  );
