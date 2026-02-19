-- Add social_links and tier columns to profiles table
-- Created manually to sync DB state with repository

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free' 
CHECK (tier IN ('free', 'pro', 'enterprise'));
