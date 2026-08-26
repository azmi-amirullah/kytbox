-- Migration: 20260826_add_priority_to_list_items.sql
-- Add priority level to list items with check constraint and indexing

ALTER TABLE list_items
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT NULL;

ALTER TABLE list_items DROP CONSTRAINT IF EXISTS list_items_priority_check;
ALTER TABLE list_items ADD CONSTRAINT list_items_priority_check
  CHECK (priority IS NULL OR priority IN ('urgent', 'high', 'medium', 'low'));

CREATE INDEX IF NOT EXISTS idx_list_items_priority
  ON list_items (list_id, priority)
  WHERE priority IS NOT NULL;
