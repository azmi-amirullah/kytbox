-- Migration: 20260712000300_performance_indexes.sql
-- Missing database indexes for links, cashflow entries, and list items to optimize sorting and dashboard queries.

-- Optimizes recent activity feed unions and sorting by creation time
CREATE INDEX IF NOT EXISTS idx_links_created_at ON public.links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_created_at ON public.cashflow_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_list_items_created_at ON public.list_items(created_at DESC);

-- Optimizes sorting by date inside cashflow entry listings
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_cashflow_date ON public.cashflow_entries(cashflow_id, date DESC);
