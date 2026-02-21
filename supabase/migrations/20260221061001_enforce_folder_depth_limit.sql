-- Trigger to prevent deep nesting and folder-in-folder

CREATE OR REPLACE FUNCTION check_folder_depth()
RETURNS TRIGGER AS $$
DECLARE
  parent_is_folder BOOLEAN;
BEGIN
  -- Rule 1: A folder cannot be placed inside another folder
  IF NEW.is_folder = true AND NEW.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Folders cannot be nested inside other folders. Maximum depth is 1.';
  END IF;

  -- Rule 2: If a link is placed inside a folder, verify the parent is actually a folder
  -- (and since a folder can't have a parent due to Rule 1, we guarantee 1-level depth)
  IF NEW.parent_id IS NOT NULL THEN
    SELECT is_folder INTO parent_is_folder
    FROM links
    WHERE id = NEW.parent_id;

    IF parent_is_folder = false THEN
      RAISE EXCEPTION 'A link can only be placed inside a folder, not another link.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_folder_depth_limit ON links;

CREATE TRIGGER enforce_folder_depth_limit
  BEFORE INSERT OR UPDATE ON links
  FOR EACH ROW
  EXECUTE FUNCTION check_folder_depth();
