-- Migration: 20260718_add_onboarding_flag.sql
ALTER TABLE profiles ADD COLUMN has_completed_onboarding boolean NOT NULL DEFAULT false;
