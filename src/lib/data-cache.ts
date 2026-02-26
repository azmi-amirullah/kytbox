import { unstable_cache } from 'next/cache';
import { createStaticClient } from '@/lib/supabase/server';

/**
 * Get Public Profile by Username
 * Uses stable Next.js 16 nested caching (unstable_cache)
 */
export async function getProfileByUsername(username: string) {
  return unstable_cache(
    async (uname: string) => {
      const supabase = createStaticClient();
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, display_name, bio, avatar_url, theme_name, button_style, button_shape, social_links, custom_theme, default_currency',
        )
        .eq('username', uname)
        .single();

      if (error) return null;
      return data;
    },
    [`profile-${username}`],
    {
      tags: [`profile-${username}`],
    },
  )(username);
}
