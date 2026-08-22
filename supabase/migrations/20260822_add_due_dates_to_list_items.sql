-- Migration: 20260822_add_due_dates_to_list_items.sql
-- Add due_date and reminder_sent tracking to list items

ALTER TABLE list_items
  ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false;

-- High performance partial index for cron reminder scans
CREATE INDEX IF NOT EXISTS idx_list_items_due_date
  ON list_items (due_date)
  WHERE is_completed = false AND due_date IS NOT NULL;

-- Update notifications check constraint to allow task reminders
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('support_reply', 'budget_warning', 'budget_exceeded', 'click_milestone', 'system', 'task_reminder'));
