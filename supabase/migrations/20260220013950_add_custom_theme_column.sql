-- Add custom_theme JSONB column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_theme JSONB;

-- Optionally, add a constraint to ensure the JSON structure is somewhat valid or just let it be open
-- We can enforce { background, textPrimary, textSecondary, buttonBg, buttonText... } via the application logic,
-- but we'll leave it simple here jsonb to be flexible for future additions.
