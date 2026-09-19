-- Migration: Platform & Bio Week 4 Power Features
-- Date: 2026-09-22
-- Description:
--   1. Day 25: Bento-Style Grid Layout Canvas (grid_size column on public.links)
--   2. Day 26: Persistent Audio & Podcast Stream Widget (stream_url, audio_artist, audio_cover_url on public.links)

-- 1. Day 25: Add grid_size to links table
ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS grid_size text DEFAULT 'full';

-- Add check constraint for valid bento grid sizes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'links_grid_size_check'
  ) THEN
    ALTER TABLE public.links
      ADD CONSTRAINT links_grid_size_check
      CHECK (grid_size IN ('1x1', '1x2', '2x2', 'full'));
  END IF;
END $$;

-- 2. Day 26: Add audio stream metadata columns to links table
ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS stream_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audio_artist text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audio_cover_url text DEFAULT NULL;
