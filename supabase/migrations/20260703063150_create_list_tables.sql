-- 1. Create tables

CREATE TABLE lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  type text not null check (type in ('todo', 'wishlist', 'idea')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE list_columns (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  is_done_column boolean not null default false,
  created_at timestamptz not null default now()
);

CREATE TABLE list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  column_id uuid references list_columns(id) on delete cascade,
  title text not null,
  description text,
  is_completed boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 2. Create summary view
CREATE VIEW list_summaries WITH (security_invoker = true) AS
SELECT
  l.id, l.user_id, l.title, l.description, l.type, l.is_public,
  l.created_at, l.updated_at,
  COUNT(li.id)::int AS item_count,
  COUNT(li.id) FILTER (WHERE li.is_completed = true)::int AS completed_count
FROM lists l
LEFT JOIN list_items li ON li.list_id = l.id
GROUP BY l.id;

-- 3. Triggers
CREATE OR REPLACE FUNCTION update_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_lists_updated_at();

CREATE OR REPLACE FUNCTION touch_list_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lists SET updated_at = now()
  WHERE id = COALESCE(NEW.list_id, OLD.list_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_touch_list_on_item
  AFTER INSERT OR UPDATE OR DELETE ON list_items
  FOR EACH ROW EXECUTE FUNCTION touch_list_on_item_change();

-- 4. RLS Policies
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- Lists RLS
CREATE POLICY "Users can manage their own lists" ON lists
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public lists are viewable by anyone" ON lists
  FOR SELECT USING (is_public = true);

-- List Columns RLS
CREATE POLICY "Users can manage columns of their lists" ON list_columns
  FOR ALL USING (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
CREATE POLICY "Public columns are viewable by anyone" ON list_columns
  FOR SELECT USING (list_id IN (SELECT id FROM lists WHERE is_public = true));

-- List Items RLS
CREATE POLICY "Users can manage items of their lists" ON list_items
  FOR ALL USING (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
CREATE POLICY "Public items are viewable by anyone" ON list_items
  FOR SELECT USING (list_id IN (SELECT id FROM lists WHERE is_public = true));

-- 5. Indexes
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_type ON lists(type);
CREATE INDEX idx_lists_is_public ON lists(is_public) WHERE is_public = true;
CREATE INDEX idx_list_columns_list_id ON list_columns(list_id);
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_list_items_column_id ON list_items(column_id);
CREATE INDEX idx_list_items_sort_order ON list_items(list_id, sort_order);
