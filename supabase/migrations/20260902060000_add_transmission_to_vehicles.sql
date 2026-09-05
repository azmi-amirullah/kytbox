-- Add transmission column to vehicles table
alter table public.vehicles
  add column if not exists transmission text check (transmission in ('automatic', 'manual')) default 'automatic' not null;

comment on column public.vehicles.transmission is 'Drivetrain transmission: automatic (including CVT, DCT, AT, single-speed reduction) or manual (MT, clutch/chain).';
