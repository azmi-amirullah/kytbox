-- Migration: 20260714_add_link_scheduling.sql
ALTER TABLE links ADD COLUMN scheduled_at timestamptz DEFAULT NULL;
ALTER TABLE links ADD COLUMN expires_at timestamptz DEFAULT NULL;

-- Index for efficient filtering on public page
CREATE INDEX idx_links_schedule ON links(scheduled_at, expires_at)
  WHERE scheduled_at IS NOT NULL OR expires_at IS NOT NULL;
