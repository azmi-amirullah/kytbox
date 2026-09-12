-- Create vehicle_services table
create table if not exists vehicle_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  service_date date not null,
  odometer integer not null,
  service_type text not null check (service_type in ('routine', 'repair', 'inspection', 'upgrade')),
  items_serviced text[] not null default '{}',
  serviced_rule_ids uuid[] not null default '{}',
  cost numeric(12, 2) not null default 0,
  workshop_name text,
  invoice_number text,
  external_invoice_url text,
  notes text,
  cashflow_entry_id uuid references cashflow_entries(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_vehicle_services_vehicle on vehicle_services(vehicle_id);
create index if not exists idx_vehicle_services_user on vehicle_services(user_id);
create index if not exists idx_vehicle_services_date on vehicle_services(vehicle_id, service_date desc);

alter table vehicle_services enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'vehicle_services' and policyname = 'Users manage their own vehicle services'
  ) then
    create policy "Users manage their own vehicle services" on vehicle_services for all using (auth.uid() = user_id);
  end if;
end $$;
