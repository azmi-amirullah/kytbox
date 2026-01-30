-- Add button_shape column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS button_shape text DEFAULT 'rounded';

-- Ensure default is set for existing column
ALTER TABLE public.profiles ALTER COLUMN button_shape SET DEFAULT 'rounded';

-- Update comment for clarity
COMMENT ON COLUMN public.profiles.button_shape IS 'Visual shape of buttons: rounded, square';
