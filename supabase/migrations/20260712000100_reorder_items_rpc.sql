-- Migration: 20260712000100_reorder_items_rpc.sql
-- Atomic reordering for list items and list columns to prevent N-query HTTP waterfalls.

CREATE OR REPLACE FUNCTION reorder_list_items(p_item_ids uuid[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  -- Security check: Verify all items belong to lists owned by the authenticated user
  IF EXISTS (
    SELECT 1 
    FROM unnest(p_item_ids) AS t(id)
    LEFT JOIN list_items li ON li.id = t.id
    LEFT JOIN lists l ON l.id = li.list_id
    WHERE l.user_id IS DISTINCT FROM auth.uid() OR l.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: One or more item IDs do not belong to you or do not exist';
  END IF;

  -- Bulk update using ordinality index
  UPDATE list_items AS li
  SET sort_order = t.new_order * 1024
  FROM (
    SELECT id, (row_number() OVER () - 1) AS new_order
    FROM unnest(p_item_ids) AS id
  ) AS t
  WHERE li.id = t.id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reorder_list_items(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION reorder_list_columns(p_column_ids uuid[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  -- Security check: Verify all columns belong to lists owned by the authenticated user
  IF EXISTS (
    SELECT 1 
    FROM unnest(p_column_ids) AS t(id)
    LEFT JOIN list_columns lc ON lc.id = t.id
    LEFT JOIN lists l ON l.id = lc.list_id
    WHERE l.user_id IS DISTINCT FROM auth.uid() OR l.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: One or more column IDs do not belong to you or do not exist';
  END IF;

  -- Bulk update using ordinality index
  UPDATE list_columns AS lc
  SET sort_order = t.new_order * 1024
  FROM (
    SELECT id, (row_number() OVER () - 1) AS new_order
    FROM unnest(p_column_ids) AS id
  ) AS t
  WHERE lc.id = t.id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reorder_list_columns(uuid[]) TO authenticated;
