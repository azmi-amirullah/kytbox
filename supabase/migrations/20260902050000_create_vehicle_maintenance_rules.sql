-- Create vehicle_maintenance_rules table
create table if not exists vehicle_maintenance_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  name text not null,
  category text not null,
  interval_distance integer,
  interval_months integer,
  last_service_odometer integer,
  last_service_date date,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_vehicle_maintenance_rules_vehicle on vehicle_maintenance_rules(vehicle_id);
create index if not exists idx_vehicle_maintenance_rules_user on vehicle_maintenance_rules(user_id);

alter table vehicle_maintenance_rules enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'vehicle_maintenance_rules' and policyname = 'Users manage their own maintenance rules'
  ) then
    create policy "Users manage their own maintenance rules" on vehicle_maintenance_rules for all using (auth.uid() = user_id);
  end if;
end $$;
