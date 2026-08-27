-- Migration: 20260827_add_recurrence_to_list_items.sql
-- Add recurrence rule to list items for automated recurring tasks engine

ALTER TABLE list_items
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT DEFAULT NULL;

ALTER TABLE list_items DROP CONSTRAINT IF EXISTS list_items_recurrence_rule_check;
ALTER TABLE list_items ADD CONSTRAINT list_items_recurrence_rule_check
  CHECK (recurrence_rule IS NULL OR recurrence_rule IN ('daily', 'weekdays', 'weekly', 'monthly'));

CREATE INDEX IF NOT EXISTS idx_list_items_recurrence_rule
  ON list_items (list_id, recurrence_rule)
  WHERE recurrence_rule IS NOT NULL;
