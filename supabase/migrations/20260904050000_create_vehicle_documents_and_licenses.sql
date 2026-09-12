-- Migration: 20260904050000_create_vehicle_documents_and_licenses.sql

-- 1. Patch notifications.type check constraint to include 'garage_alert'
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (
  type in (
    'support_reply',
    'budget_warning',
    'budget_exceeded',
    'click_milestone',
    'system',
    'task_reminder',
    'garage_alert'
  )
);

-- 2. Create vehicle_documents table
create table if not exists vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  document_type text not null check (
    document_type in (
      'road_tax_annual',
      'registration_renewal',
      'insurance',
      'inspection',
      'other'
    )
  ),
  document_number text,
  expiry_date date not null,
  cost numeric(12, 2) not null default 0,
  notes text,
  cashflow_entry_id uuid references cashflow_entries(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_vehicle_documents_user on vehicle_documents(user_id);
create index if not exists idx_vehicle_documents_vehicle on vehicle_documents(vehicle_id);
create index if not exists idx_vehicle_documents_expiry on vehicle_documents(vehicle_id, expiry_date asc);

alter table vehicle_documents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'vehicle_documents' and policyname = 'Users manage their own vehicle documents'
  ) then
    create policy "Users manage their own vehicle documents" on vehicle_documents for all using (auth.uid() = user_id);
  end if;
end $$;

-- 3. Create driver_licenses table (scoped to user on garage root)
create table if not exists driver_licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  license_name text not null,
  category text not null check (
    category in (
      'car',
      'motorcycle',
      'commercial',
      'other'
    )
  ),
  license_number text,
  expiry_date date not null,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_driver_licenses_user on driver_licenses(user_id);
create index if not exists idx_driver_licenses_expiry on driver_licenses(user_id, expiry_date asc);

alter table driver_licenses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'driver_licenses' and policyname = 'Users manage their own driver licenses'
  ) then
    create policy "Users manage their own driver licenses" on driver_licenses for all using (auth.uid() = user_id);
  end if;
end $$;
