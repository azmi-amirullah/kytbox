-- Migration: Cashflow Tags Feature
-- Description:
--   1. Adds tags array column and GIN index to cashflow_entries.
--   2. Creates normalized cashflow_tags registry table for persistent color allocation.
--   3. Configures Row Level Security (RLS) for owners and shared users.
--   4. Performs idempotent backfill from existing transactions.

-- 1. Tags column on cashflow_entries
ALTER TABLE cashflow_entries
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_cashflow_entries_tags
  ON cashflow_entries USING GIN (tags);

COMMENT ON COLUMN cashflow_entries.tags IS 'Flexible user-defined tags/labels for custom filtering (e.g. #TaxDeductible, #ClientProjectA)';

-- 2. Dedicated cashflow_tags table
CREATE TABLE IF NOT EXISTS cashflow_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashflow_id uuid REFERENCES cashflows(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color_index integer NOT NULL DEFAULT 0 CHECK (color_index >= 0 AND color_index < 12),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(cashflow_id, name)
);

-- Performance index for lookup by book and creation order
CREATE INDEX IF NOT EXISTS idx_cashflow_tags_book_created
  ON cashflow_tags(cashflow_id, created_at ASC);

-- 3. Row Level Security (RLS)
ALTER TABLE cashflow_tags ENABLE ROW LEVEL SECURITY;

-- Owner policy
DROP POLICY IF EXISTS "Owners can manage their cashflow tags" ON cashflow_tags;
CREATE POLICY "Owners can manage their cashflow tags" ON cashflow_tags
  FOR ALL USING (
    cashflow_id IN (SELECT id FROM cashflows WHERE user_id = auth.uid())
  );

-- Shared reader/editor select policy
DROP POLICY IF EXISTS "Editors can select cashflow tags" ON cashflow_tags;
CREATE POLICY "Editors can select cashflow tags" ON cashflow_tags
  FOR SELECT USING (
    cashflow_id IN (
      SELECT cashflow_id FROM cashflow_shares
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Shared editor insert policy
DROP POLICY IF EXISTS "Editors can insert cashflow tags" ON cashflow_tags;
CREATE POLICY "Editors can insert cashflow tags" ON cashflow_tags
  FOR INSERT WITH CHECK (
    cashflow_id IN (
      SELECT cashflow_id FROM cashflow_shares
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role = 'edit'
    )
  );

-- Shared editor update policy
DROP POLICY IF EXISTS "Editors can update cashflow tags" ON cashflow_tags;
CREATE POLICY "Editors can update cashflow tags" ON cashflow_tags
  FOR UPDATE USING (
    cashflow_id IN (
      SELECT cashflow_id FROM cashflow_shares
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role = 'edit'
    )
  );

-- Shared editor delete policy
DROP POLICY IF EXISTS "Editors can delete cashflow tags" ON cashflow_tags;
CREATE POLICY "Editors can delete cashflow tags" ON cashflow_tags
  FOR DELETE USING (
    cashflow_id IN (
      SELECT cashflow_id FROM cashflow_shares
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role = 'edit'
    )
  );

-- 4. Backfill: populate cashflow_tags from existing cashflow_entries.tags
DO $$
DECLARE
  r RECORD;
  t text;
  c_idx integer;
  current_count integer;
BEGIN
  FOR r IN (
    SELECT DISTINCT e.cashflow_id, c.user_id, e.created_at, unnest(e.tags) as tag_name
    FROM cashflow_entries e
    JOIN cashflows c ON c.id = e.cashflow_id
    WHERE e.tags IS NOT NULL AND array_length(e.tags, 1) > 0
    ORDER BY e.created_at ASC
  ) LOOP
    IF r.tag_name IS NOT NULL AND trim(r.tag_name) <> '' THEN
      SELECT count(*) INTO current_count
      FROM cashflow_tags
      WHERE cashflow_id = r.cashflow_id;

      c_idx := current_count % 12;

      INSERT INTO cashflow_tags (cashflow_id, user_id, name, color_index, created_at)
      VALUES (r.cashflow_id, r.user_id, trim(r.tag_name), c_idx, r.created_at)
      ON CONFLICT (cashflow_id, name) DO NOTHING;
    END IF;
  END LOOP;
END $$;
