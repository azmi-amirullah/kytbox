-- Migration: Create cashflow_split_entries table for split transactions / purchase breakdown items
CREATE TABLE IF NOT EXISTS public.cashflow_split_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_entry_id UUID NOT NULL REFERENCES public.cashflow_entries(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by parent_entry_id
CREATE INDEX IF NOT EXISTS idx_cashflow_split_entries_parent ON public.cashflow_split_entries(parent_entry_id);

-- Enable RLS
ALTER TABLE public.cashflow_split_entries ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can select split entries if they own or have share access to the parent cashflow
CREATE POLICY "Users can view split entries for accessible cashflows"
    ON public.cashflow_split_entries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cashflow_entries e
            JOIN public.cashflows c ON c.id = e.cashflow_id
            WHERE e.id = cashflow_split_entries.parent_entry_id
            AND (
                c.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.cashflow_shares s
                    WHERE s.cashflow_id = c.id
                    AND LOWER(s.email) = LOWER(auth.email())
                )
            )
        )
    );

-- RLS policy: users can insert/update/delete split entries if they own or are editor of the parent cashflow
CREATE POLICY "Users can manage split entries for editable cashflows"
    ON public.cashflow_split_entries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.cashflow_entries e
            JOIN public.cashflows c ON c.id = e.cashflow_id
            WHERE e.id = cashflow_split_entries.parent_entry_id
            AND (
                c.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.cashflow_shares s
                    WHERE s.cashflow_id = c.id
                    AND LOWER(s.email) = LOWER(auth.email())
                    AND s.role = 'editor'
                )
            )
        )
    );
