-- =============================================
-- Link-Base Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Profiles Table
-- Stores user profile information linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fast username lookups (public page)
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- 2. Links Table
-- Stores user's links with ordering and click tracking
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  clicks INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fetching links by user
CREATE INDEX IF NOT EXISTS links_user_id_idx ON links(user_id);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES --

-- Anyone can read profiles (for public pages)
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- LINKS POLICIES --

-- Anyone can read active links (for public pages)
CREATE POLICY "Active links are publicly readable"
  ON links FOR SELECT
  USING (is_active = true);

-- Owners can read ALL their links (including inactive)
CREATE POLICY "Owners can read all their links"
  ON links FOR SELECT
  USING (auth.uid() = user_id);

-- Owners can insert links
CREATE POLICY "Owners can insert links"
  ON links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owners can update their links
CREATE POLICY "Owners can update their links"
  ON links FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owners can delete their links
CREATE POLICY "Owners can delete their links"
  ON links FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Function: Increment Click Count
-- Call via RPC for safe, non-abusable tracking
-- =============================================
CREATE OR REPLACE FUNCTION increment_link_click(link_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE links
  SET 
    clicks = clicks + 1,
    last_clicked_at = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
