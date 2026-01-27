-- Atomic Link Reordering
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION reorder_links(p_link_ids uuid[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  l_id uuid;
  l_index int := 0;
BEGIN
  -- Security check: Ensure all p_link_ids belong to the authenticated user
  -- We use "t(id)" to explicitly alias the column from unnest to avoid ambiguity
  IF EXISTS (
    SELECT 1 
    FROM unnest(p_link_ids) AS t(id)
    LEFT JOIN links ON links.id = t.id
    WHERE links.user_id IS DISTINCT FROM auth.uid() -- Catch mismatch or NULL (if link not found)
       OR links.id IS NULL -- Explicitly catch non-existent links
  ) THEN
    RAISE EXCEPTION 'Unauthorized: One or more link IDs do not belong to you or do not exist';
  END IF;

  -- Update sort_order for each link in the provided array
  FOREACH l_id IN ARRAY p_link_ids
  LOOP
    UPDATE links
    SET sort_order = l_index
    WHERE id = l_id AND user_id = auth.uid();
    
    l_index := l_index + 1;
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reorder_links(uuid[]) TO authenticated;
