-- Migration: 20260812_add_link_display_mode.sql
ALTER TABLE links ADD COLUMN display_mode text DEFAULT 'link';
