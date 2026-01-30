-- Add theme settings to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_name TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'default';

-- Ensure defaults are set for existing columns if already created
ALTER TABLE profiles ALTER COLUMN theme_name SET DEFAULT 'default';
ALTER TABLE profiles ALTER COLUMN button_style SET DEFAULT 'default';

-- Add comment for clarity
COMMENT ON COLUMN profiles.theme_name IS 'Current visual theme: default, dark, gradient, etc.';
COMMENT ON COLUMN profiles.button_style IS 'Fill style of buttons: default, outline';
