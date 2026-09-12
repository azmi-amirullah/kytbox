-- Migration: 20260905050000_create_vehicle_fuel_logs.sql
-- Create vehicle_fuel_logs table for Day 5 Fuel Log Engine

create table if not exists vehicle_fuel_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  log_date date not null,
  odometer integer not null,
  fuel_amount numeric(8, 2) not null,
  price_per_unit numeric(10, 2),
  total_cost numeric(12, 2) not null,
  is_full_tank boolean default true,
  is_missed_previous boolean default false,
  battery_start_pct smallint check (battery_start_pct between 0 and 100),
  battery_end_pct smallint check (battery_end_pct between 0 and 100),
  calculated_kml numeric(6, 2),
  notes text,
  cashflow_entry_id uuid references cashflow_entries(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_vehicle_fuel_logs_vehicle_date on vehicle_fuel_logs(vehicle_id, log_date desc);
create index if not exists idx_vehicle_fuel_logs_user on vehicle_fuel_logs(user_id);
create index if not exists idx_vehicle_fuel_logs_odo on vehicle_fuel_logs(vehicle_id, odometer desc);

alter table vehicle_fuel_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'vehicle_fuel_logs' and policyname = 'Users manage their own fuel logs'
  ) then
    create policy "Users manage their own fuel logs" on vehicle_fuel_logs for all using (auth.uid() = user_id);
  end if;
end $$;
