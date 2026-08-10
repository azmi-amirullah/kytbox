-- Migration: Add SEO metadata fields to profiles table
-- Day 1 — Bio: SEO Metadata Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;
