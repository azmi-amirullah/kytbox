import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Get user profile by username.
 * Cached and tagged for surgical revalidation.
 */
export const getProfileByUsername = (username: string) =>
  unstable_cache(
    async (username: string) => {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      return profile;
    },
    ['profile-by-username', username],
    {
      tags: [`profile-${username}`],
      revalidate: 3600, // 1 hour secondary cache
    },
  )(username);

/**
 * Get user profile by ID.
 */
export const getProfileById = (userId: string) =>
  unstable_cache(
    async (userId: string) => {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return profile;
    },
    ['profile-by-id', userId],
    {
      tags: [`profile-id-${userId}`],
      revalidate: 3600,
    },
  )(userId);
