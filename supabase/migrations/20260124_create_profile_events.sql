-- Create table for bio page view tracking
create table if not exists profile_events (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  user_agent text,
  referer text,
  country text,
  city text,
  device_type text
);

-- Indexes for fast analytics queries
create index if not exists idx_profile_events_profile_id on profile_events(profile_id);
create index if not exists idx_profile_events_created_at on profile_events(created_at);

-- RLS Policies
alter table profile_events enable row level security;

-- SECURITY UPDATE:
-- We explicitly DROP the anonymous insert policy if it exists, as we have switched
-- to using the Server-Side Secret Key for tracking events. This closes the spam vulnerability.
drop policy if exists "Allow anonymous inserts" on profile_events;

-- Allow users to read ONLY their own profile events (for analytics dashboard)
drop policy if exists "Users can read own profile events" on profile_events;

create policy "Users can read own profile events"
  on profile_events
  for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = profile_events.profile_id
      and profiles.id = auth.uid()
    )
  );
