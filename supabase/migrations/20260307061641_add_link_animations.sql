-- Migration to add animation_type to links
ALTER TABLE links ADD COLUMN IF NOT EXISTS animation_type TEXT DEFAULT 'none';
