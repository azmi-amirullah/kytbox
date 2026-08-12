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
      'id, username, display_name, bio, avatar_url, theme_name, button_style, button_shape, social_links, custom_theme, default_currency, meta_title, meta_description, og_image_url, lead_capture_enabled',
    )
    .eq('username', username)
    .single();

  if (error) return null;
  return data;
}

/**
 * Get Public Links by User ID
 * Uses stable Next.js 16 modern caching ('use cache')
 */
export async function getCachedPublicLinks(userId: string, username: string) {
  'use cache';
  cacheTag(`links-${username}`);

  const supabase = createStaticClient();
  const { data, count, error } = await supabase
    .from('links')
    .select(
      'id, title, url, is_active, short_id, is_folder, is_header, parent_id, sort_order, animation_type, display_mode, icon_url, scheduled_at, expires_at, is_pinned, is_sensitive, children:links(count)',
      { count: 'exact' },
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('parent_id', null)
    .order('is_pinned', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(0, 49);

  if (error) return { data: [], count: 0 };
  return { data: data || [], count: count || 0 };
}

/**
 * Get Bio Profile Username by Verified Custom Domain
 */
export async function getProfileByDomain(domain: string) {
  const cleanDomain = domain.toLowerCase();

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('custom_domains')
    .select('profile_id, status, profiles!inner(username)')
    .eq('domain', cleanDomain)
    .eq('status', 'verified')
    .maybeSingle();

  if (error || !data || !data.profiles) return null;

  // Supabase returns object or array depending on relation metadata
  const profilesObj = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  if (profilesObj && typeof profilesObj.username === 'string') {
    return { username: profilesObj.username };
  }
  return null;
}


