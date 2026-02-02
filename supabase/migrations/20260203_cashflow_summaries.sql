-- Create a view to aggregate cashflow statistics
-- This moves the O(N) calculation from the application server to the database
create or replace view public.cashflow_summaries with (security_invoker = true) as
select
  c.id,
  c.user_id,
  c.title,
  c.created_at,
  count(e.id) as entry_count,
  coalesce(sum(case when e.type = 'income' then e.amount else 0 end), 0) as income,
  coalesce(sum(case when e.type = 'expense' then e.amount else 0 end), 0) as expense,
  coalesce(sum(case when e.type = 'income' then e.amount else -e.amount end), 0) as balance
from
  public.cashflows c
  left join public.cashflow_entries e on c.id = e.cashflow_id
group by
  c.id;

-- Grant access to the view
grant select on public.cashflow_summaries to authenticated;
