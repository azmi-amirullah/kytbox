-- Migration: Create bio_subscribers table for lead capture
-- Day 3 — Bio: Lead Capture Form Widget

CREATE TABLE IF NOT EXISTS bio_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index to prevent duplicate subscriptions per profile (case-insensitive email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bio_subscribers_profile_email
  ON bio_subscribers (profile_id, LOWER(email));

-- Index for fast retrieval ordered by subscription date
CREATE INDEX IF NOT EXISTS idx_bio_subscribers_profile_created
  ON bio_subscribers (profile_id, created_at DESC);

-- Enable RLS
ALTER TABLE bio_subscribers ENABLE ROW LEVEL SECURITY;

-- Owner can read their subscribers
CREATE POLICY "Profiles can view own subscribers"
  ON bio_subscribers FOR SELECT
  USING (auth.uid() = profile_id);

-- Public / anon / authenticated users can insert subscriptions
CREATE POLICY "Anyone can subscribe to a bio profile"
  ON bio_subscribers FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = profile_id));

-- Owner can delete subscribers
CREATE POLICY "Profiles can delete own subscribers"
  ON bio_subscribers FOR DELETE
  USING (auth.uid() = profile_id);
