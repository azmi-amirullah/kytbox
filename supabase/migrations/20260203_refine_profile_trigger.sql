-- =============================================
-- Fix: Stop Automatic Profile Creation for Google Auth
-- Run this in Supabase SQL Editor
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if username is provided (e.g. from Signup form)
  -- Google Auth does not provide 'username' in metadata by default, so it will skip this.
  IF NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'username',
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
