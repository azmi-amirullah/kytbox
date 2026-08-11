-- Migration: Add lead_capture_enabled column to profiles
-- Day 3 — Bio: Lead Capture Toggle Settings

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lead_capture_enabled BOOLEAN NOT NULL DEFAULT true;
