-- Migration: 20260822_create_list_subtasks.sql
-- Create list_subtasks table for card checklists & subtask engine

CREATE TABLE IF NOT EXISTS public.list_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup & ordering indexes
CREATE INDEX IF NOT EXISTS idx_list_subtasks_item_id ON public.list_subtasks(item_id);
CREATE INDEX IF NOT EXISTS idx_list_subtasks_position ON public.list_subtasks(item_id, position);

-- Enable RLS
ALTER TABLE public.list_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage subtasks of their lists"
    ON public.list_subtasks
    FOR ALL
    USING (
        item_id IN (
            SELECT li.id FROM public.list_items li
            JOIN public.lists l ON l.id = li.list_id
            WHERE l.user_id = auth.uid()
        )
    );

CREATE POLICY "Public subtasks are viewable by anyone"
    ON public.list_subtasks
    FOR SELECT
    USING (
        item_id IN (
            SELECT li.id FROM public.list_items li
            JOIN public.lists l ON l.id = li.list_id
            WHERE l.is_public = true
        )
    );
