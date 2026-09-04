-- Create vehicles table
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null default 'car',
  license_plate text,
  year integer,
  is_default boolean not null default false,
  current_odometer integer not null default 0,
  odometer_unit text not null default 'km',
  estimated_monthly_km integer default 1000,
  fuel_type text not null default 'petrol',
  currency text not null default 'IDR',
  is_archived boolean not null default false,
  vin text,
  preferred_cashflow_id uuid references cashflows(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vehicles_user_id on vehicles(user_id);
create unique index if not exists idx_vehicles_one_default_per_user on vehicles(user_id) where is_default = true and not is_archived;

alter table vehicles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'vehicles' and policyname = 'Users manage their own vehicles'
  ) then
    create policy "Users manage their own vehicles" on vehicles for all using (auth.uid() = user_id);
  end if;
end $$;

-- Create vehicle_monthly_odometers table
create table if not exists vehicle_monthly_odometers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  year_month text not null,
  odometer integer not null,
  updated_at timestamptz default now(),
  unique (vehicle_id, year_month)
);

create index if not exists idx_monthly_odo on vehicle_monthly_odometers(vehicle_id, year_month);
create index if not exists idx_monthly_odo_user on vehicle_monthly_odometers(user_id);

alter table vehicle_monthly_odometers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'vehicle_monthly_odometers' and policyname = 'Users manage their own monthly odometers'
  ) then
    create policy "Users manage their own monthly odometers" on vehicle_monthly_odometers for all using (auth.uid() = user_id);
  end if;
end $$;
