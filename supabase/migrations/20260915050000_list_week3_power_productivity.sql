-- Migration: List Week 3 Power Productivity
-- Date: 2026-09-15
-- Description:
--   1. Day 15: Card Custom Colored Labels & Multi-Tag Taxonomy (list_labels table & labels column on list_items)
--   2. Day 16: Card Resource Links & Cloud Attachment Bookmarks (list_item_resources table)
--   3. Day 17: Column WIP Limits & Fractional Indexing (wip_limit column on list_columns & double precision sort_order)

-- 1. Day 15: Add labels to list_items
ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS labels text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_list_items_labels
  ON public.list_items USING gin(labels);

-- Day 15: Create list_labels table
CREATE TABLE IF NOT EXISTS public.list_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (list_id, name)
);

CREATE INDEX IF NOT EXISTS idx_list_labels_list ON public.list_labels(list_id);

ALTER TABLE public.list_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own list labels"
  ON public.list_labels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE lists.id = list_labels.list_id
        AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Public read list labels"
  ON public.list_labels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE lists.id = list_labels.list_id
        AND lists.is_public = true
    )
  );

-- 2. Day 16: Create list_item_resources table (Cloud Attachment Bookmarks, 0 bytes storage)
CREATE TABLE IF NOT EXISTS public.list_item_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.list_items(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  title text,
  domain text,
  icon_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_list_item_resources_item ON public.list_item_resources(item_id);

ALTER TABLE public.list_item_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own list item resources"
  ON public.list_item_resources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.list_items
      JOIN public.lists ON lists.id = list_items.list_id
      WHERE list_items.id = list_item_resources.item_id
        AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Public read list item resources"
  ON public.list_item_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.list_items
      JOIN public.lists ON lists.id = list_items.list_id
      WHERE list_items.id = list_item_resources.item_id
        AND lists.is_public = true
    )
  );

-- 3. Day 17: Column WIP limits & Fractional indexing support
ALTER TABLE public.list_columns
  ADD COLUMN IF NOT EXISTS wip_limit integer DEFAULT NULL;

ALTER TABLE public.list_items
  ALTER COLUMN sort_order TYPE double precision;
