-- Migration: Add image_url to cashflow_goals for debt document / receipt attachments
ALTER TABLE public.cashflow_goals
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;
