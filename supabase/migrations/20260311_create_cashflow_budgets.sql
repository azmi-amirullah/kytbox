-- Migration: Create cashflow_budgets table
-- Date: 2026-03-11
-- Description: Add hard budget limits per category per cashflow.
--   - One budget per (cashflow_id, category) enforced via UNIQUE constraint.
--   - RLS: owners manage (all), editors can read only.

create table cashflow_budgets (
  id uuid primary key default gen_random_uuid(),
  cashflow_id uuid references cashflows(id) on delete cascade not null,
  category text not null,
  amount numeric not null check (amount > 0),
  period text not null default 'monthly' check (period in ('monthly')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(cashflow_id, category)
);

alter table cashflow_budgets enable row level security;

-- Owners can manage their own budgets (all operations)
create policy "Owner can manage budgets" on cashflow_budgets
  for all using (
    cashflow_id in (select id from cashflows where user_id = auth.uid())
  );

-- Editors can read budgets (shared via cashflow_shares with role='edit')
create policy "Editors can read budgets" on cashflow_budgets
  for select using (
    cashflow_id in (
      select cashflow_id from cashflow_shares
      where lower(email) = lower(auth.jwt() ->> 'email')
      and role = 'edit'
    )
  );
