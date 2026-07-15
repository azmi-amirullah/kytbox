-- Migration: 20260715_add_link_headers.sql
ALTER TABLE links ADD COLUMN is_header boolean NOT NULL DEFAULT false;
