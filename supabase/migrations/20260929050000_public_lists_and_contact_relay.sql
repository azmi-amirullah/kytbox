-- Migration: Public Lists, Wishlists & Contact Relay (Week 5: Days 29 & 30)
-- Date: 2026-09-29
-- Description:
--   1. Day 29: List Public Sharing & Wishlists with Guest Gift Claiming (slug on public.lists, atomic claim function)
--   2. Day 30: Bio & Platform Contact Relay Widget (bio_contact_messages table with RLS)

-- ============================================================================
-- 1. Day 29: Add slug to public.lists & unique constraint per user
-- ============================================================================

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS slug text;

-- Generate collision-proof initial slug for existing lists
WITH cleaned AS (
  SELECT
    id,
    user_id,
    coalesce(nullif(trim(both '-' from lower(regexp_replace(trim(coalesce(nullif(title, ''), 'list')), '[^a-zA-Z0-9]+', '-', 'g'))), ''), 'list') AS clean_base,
    created_at
  FROM public.lists
),
ranked AS (
  SELECT
    id,
    user_id,
    clean_base,
    ROW_NUMBER() OVER (PARTITION BY user_id, clean_base ORDER BY created_at ASC) AS rn
  FROM cleaned
)
UPDATE public.lists l
SET slug = CASE
  WHEN r.rn = 1 THEN r.clean_base
  ELSE r.clean_base || '-' || substr(r.id::text, 1, 8)
END
FROM ranked r
WHERE l.id = r.id AND l.slug IS NULL;

-- Cleanup empty or leading/trailing dash slugs
UPDATE public.lists
SET slug = 'list-' || substr(id::text, 1, 8)
WHERE slug IS NULL OR slug = '' OR slug = '-';

-- Add unique constraint on (user_id, slug)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lists_user_id_slug_unique'
  ) THEN
    ALTER TABLE public.lists
      ADD CONSTRAINT lists_user_id_slug_unique UNIQUE (user_id, slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lists_user_id_slug ON public.lists (user_id, slug);

-- Update list_summaries view to include slug
-- Drop and recreate list_summaries view to include slug without column position conflict
DROP VIEW IF EXISTS public.list_summaries;
CREATE VIEW public.list_summaries WITH (security_invoker = true) AS
SELECT
  l.id, l.user_id, l.title, l.description, l.type, l.is_public, l.slug,
  l.created_at, l.updated_at,
  COUNT(li.id)::int AS item_count,
  COUNT(li.id) FILTER (WHERE li.is_completed = true)::int AS completed_count
FROM lists l
LEFT JOIN list_items li ON li.list_id = l.id
GROUP BY l.id;

-- Atomic Wishlist Item Claiming Function to prevent race conditions
CREATE OR REPLACE FUNCTION public.claim_wishlist_item(
  p_item_id uuid,
  p_claim_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_item jsonb;
BEGIN
  UPDATE public.list_items
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{claim}', p_claim_data)
  WHERE id = p_item_id
    AND (metadata->'claim'->>'claimed_at' IS NULL)
  RETURNING to_jsonb(list_items.*) INTO v_updated_item;

  RETURN v_updated_item;
END;
$$;

-- ============================================================================
-- 2. Day 30: Bio Contact Relay Messages Table & RLS Policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bio_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bio_contact_messages ENABLE ROW LEVEL SECURITY;

-- Public visitors can submit contact messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bio_contact_messages' AND policyname = 'Public visitors can submit contact messages'
  ) THEN
    CREATE POLICY "Public visitors can submit contact messages"
      ON public.bio_contact_messages
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Profile owners can view, update and delete received contact messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bio_contact_messages' AND policyname = 'Profile owners can manage received contact messages'
  ) THEN
    CREATE POLICY "Profile owners can manage received contact messages"
      ON public.bio_contact_messages
      FOR ALL
      USING (profile_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bio_contact_messages_profile_created
  ON public.bio_contact_messages (profile_id, created_at DESC);
