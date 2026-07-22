-- Migration: 20260723_create_notifications.sql
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'support_reply', 'budget_warning', 'budget_exceeded',
    'click_milestone', 'system'
  )),
  title text NOT NULL,
  body text,
  link_url text, -- Where to navigate when clicked
  read_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON notifications(user_id, created_at DESC);

-- RLS Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System or authenticated users can insert notifications (e.g. support replies, budget triggers)
CREATE POLICY "Users or system insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
