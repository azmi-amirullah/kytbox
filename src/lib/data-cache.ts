import { cacheTag } from 'next/cache';
import { createStaticClient } from '@/lib/supabase/server';

/**
 * Get Public Profile by Username
 * Uses stable Next.js 16 modern caching ('use cache')
 */
export async function getProfileByUsername(username: string) {
  'use cache';
  cacheTag(`profile-${username}`);

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, bio, avatar_url, theme_name, button_style, button_shape, social_links, custom_theme, default_currency',
    )
    .eq('username', username)
    .single();

  if (error) return null;
  return data;
}
