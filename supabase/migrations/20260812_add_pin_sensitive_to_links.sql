-- Migration: 20260812_add_pin_sensitive_to_links.sql
-- Day 4: Pin Important Links & Sensitive Content Warning

ALTER TABLE links ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE links ADD COLUMN is_sensitive boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN links.is_pinned IS 'When true, link is pinned to the top of the public profile regardless of sort order';
COMMENT ON COLUMN links.is_sensitive IS 'When true, a blur/reveal overlay is shown over this link on the public profile';
