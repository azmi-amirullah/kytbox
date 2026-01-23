-- Per-User Short Link IDs Migration
-- Run this in your Supabase SQL Editor

-- 1. Add short_id column to links table (per-user sequential number)
ALTER TABLE links ADD COLUMN IF NOT EXISTS short_id integer;

-- 2. Create index for fast lookups by user_id + short_id
CREATE UNIQUE INDEX IF NOT EXISTS links_user_short_id_idx ON links(user_id, short_id);

-- 3. Backfill existing links with sequential IDs per user
-- This assigns 1, 2, 3... to each user's existing links ordered by created_at
WITH numbered_links AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as new_short_id
  FROM links
  WHERE short_id IS NULL
)
UPDATE links 
SET short_id = numbered_links.new_short_id
FROM numbered_links
WHERE links.id = numbered_links.id;

-- 4. Create function to get next short_id for a user
CREATE OR REPLACE FUNCTION get_next_short_id(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_id integer;
BEGIN
  SELECT COALESCE(MAX(short_id), 0) + 1 INTO next_id
  FROM links
  WHERE user_id = p_user_id;
  
  RETURN next_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_short_id(uuid) TO authenticated;

-- 5. Make short_id NOT NULL after backfill (optional, run after verifying backfill)
-- ALTER TABLE links ALTER COLUMN short_id SET NOT NULL;
