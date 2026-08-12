import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { mapProfileToDTO, mapLinkToDTO, mapSubscriberToDTO, mapCustomDomainToDTO } from '@/lib/mappers';
import { getProfileByUsername, getCachedPublicLinks } from '@/lib/data-cache';
import { socialLinksSchema } from './schemas.server';
import { customThemeDataSchema } from '@/lib/validation.schemas';
import type { CustomThemeData } from '@/lib/theme';
import type { ProfileDTO, LinkDTO, BioSubscriberDTO, CustomDomainDTO } from '@/types/dto';

export interface LinkClickTrend {
  thisWeek: number;
  lastWeek: number;
}

export interface BioDashboardData {
  profile: ProfileDTO & {
    theme_name: string | null;
    button_style: string | null;
    button_shape: string | null;
    display_name: string | null;
    social_links: Record<string, string>;
    custom_theme: CustomThemeData | null;
    lead_capture_enabled?: boolean;
  };
  initialLinks: LinkDTO[];
  initialSubscribers: BioSubscriberDTO[];
  totalSubscribers: number;
  publicUrl: string;
  totalLinks: number;
  activeLinksCount: number;
  rootTotalCount: number;
  activeRootTotalCount: number;
  totalViews: number;
  clickTrends: Record<string, LinkClickTrend>;
  initialCustomDomain: CustomDomainDTO | null;
}

export interface PublicProfileData {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    theme_name: string | null;
    button_style: string | null;
    button_shape: string | null;
    social_links: Record<string, string>;
    custom_theme: CustomThemeData | null;
    lead_capture_enabled?: boolean;
  };
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
    short_id: string | number | null;
    is_folder: boolean;
    is_header: boolean;
    parent_id: string | null;
    animation_type: string | null;
    display_mode?: string | null;
    icon_url?: string | null;
    child_count: number;
    is_pinned?: boolean;
    is_sensitive?: boolean;
  }[];
  totalLinks: number;
}


export async function getBioDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<BioDashboardData> {
  // Parallelize all data fetching for maximum performance
  const [
    profileResult,
    allLinksMetadataResult,
    initialRootLinksResult,
    viewsCountResult,
    clickTrendsResult,
    subscribersResult,
    customDomainResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, username, display_name, avatar_url, bio, role, created_at, theme_name, button_style, button_shape, social_links, custom_theme, default_currency, tier, has_completed_onboarding, meta_title, meta_description, og_image_url, lead_capture_enabled',
      )
      .eq('id', userId)
      .single(),
    supabase
      .from('links')
      .select('id, is_active, parent_id, is_folder')
      .eq('user_id', userId),
    supabase
      .from('links')
      .select('*, children:links(count)')
      .eq('user_id', userId)
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(0, 49),
    supabase
      .from('profile_events')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId),
    supabase
      .rpc('get_link_click_trends', { p_user_id: userId }),
    supabase
      .from('bio_subscribers')
      .select('*', { count: 'exact' })
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .range(0, 49),
    getCustomDomainForUser(supabase, userId),
  ]);

  const profile = profileResult.data;
  if (!profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  const allLinks = allLinksMetadataResult.data || [];
  const rawRootLinks = initialRootLinksResult.data || [];
  const totalViews = viewsCountResult.count || 0;

  const rawSubscribers = subscribersResult.data || [];
  const totalSubscribers = subscribersResult.count || 0;
  const initialSubscribers: BioSubscriberDTO[] = rawSubscribers.map(mapSubscriberToDTO);

  const clickTrends: Record<string, LinkClickTrend> = {};
  if (clickTrendsResult.data) {
    clickTrendsResult.data.forEach((row) => {
      clickTrends[row.link_id] = {
        thisWeek: Number(row.this_week || 0),
        lastWeek: Number(row.last_week || 0),
      };
    });
  }

  // Calculate counts based on reachability (hierarchy-aware)
  const globalTotalCount = allLinks.length;
  const inactiveFolderIds = new Set(
    allLinks.filter((l) => l.is_folder && !l.is_active).map((l) => l.id),
  );

  const reachableLinks = allLinks.filter((l) => {
    if (!l.is_active) return false;
    // Child is hidden if its folder is inactive
    if (l.parent_id && inactiveFolderIds.has(l.parent_id)) return false;
    return true;
  });

  const globalActiveCount = reachableLinks.length;
  const rootLinksData = allLinks.filter((l) => l.parent_id === null);
  const rootTotalCount = rootLinksData.length;
  const activeRootTotalCount = rootLinksData.filter((l) => l.is_active).length;

  const publicUrl = `/${profile.username}`;
  const mappedLinks = rawRootLinks.map(mapLinkToDTO);

  return {
    profile: {
      ...mapProfileToDTO(profile),
      theme_name: profile.theme_name,
      button_style: profile.button_style,
      button_shape: profile.button_shape,
      display_name: profile.display_name,
      social_links: socialLinksSchema.parse(profile.social_links),
      custom_theme: customThemeDataSchema
        .nullable()
        .catch(null)
        .parse(profile.custom_theme),
    },
    initialLinks: mappedLinks,
    initialSubscribers,
    totalSubscribers,
    publicUrl,
    totalLinks: globalTotalCount,
    activeLinksCount: globalActiveCount,
    rootTotalCount,
    activeRootTotalCount,
    totalViews,
    clickTrends,
    initialCustomDomain: customDomainResult,
  };
}

export async function getPublicProfileData(
  username: string
): Promise<PublicProfileData | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  // Get links for this specific user using cached function
  const { data: rawRootLinks } = await getCachedPublicLinks(profile.id, username);

  const now = new Date();
  const typedLinks = rawRootLinks
    .filter((link) => {
      if (link.scheduled_at && new Date(link.scheduled_at) > now) return false;
      if (link.expires_at && new Date(link.expires_at) < now) return false;
      return true;
    })
    .map((link) => ({
      id: link.id,
      title: link.title || '',
      url: link.url || '',
      is_active: !!link.is_active,
      short_id: link.short_id,
      is_folder: !!link.is_folder,
      is_header: !!link.is_header,
      parent_id: link.parent_id,
      animation_type: link.animation_type,
      display_mode: link.display_mode,
      icon_url: link.icon_url ?? null,
      child_count: link.children?.[0]?.count ?? 0,
      is_pinned: link.is_pinned === true,
      is_sensitive: link.is_sensitive === true,
    }));

  return {
    profile: {
      ...profile,
      social_links: socialLinksSchema.parse(profile.social_links),
      custom_theme: customThemeDataSchema
        .nullable()
        .catch(null)
        .parse(profile.custom_theme),
    },
    links: typedLinks,
    totalLinks: typedLinks.length + (rawRootLinks.length >= 50 ? 1 : 0),
  };
}

export async function getBioSubscribers(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<{ subscribers: BioSubscriberDTO[]; totalCount: number }> {
  const { data, count, error } = await supabase
    .from('bio_subscribers')
    .select('*', { count: 'exact' })
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch subscribers: ${error.message}`);
  }

  const subscribers = (data || []).map(mapSubscriberToDTO);
  return { subscribers, totalCount: count || 0 };
}

export async function getCustomDomainForUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CustomDomainDTO | null> {
  const { data, error } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapCustomDomainToDTO(data);
}
