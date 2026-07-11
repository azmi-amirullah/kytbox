'use server';

import { revalidatePath, updateTag } from 'next/cache';
import {
  getAuthenticatedUserAndProfileWithRateLimit as getAuthenticatedUserAndProfile,
  getAuthenticatedUserWithRateLimit as getAuthenticatedUser,
} from '@/lib/auth-with-rate-limit';
import {
  addLinkSchema,
  updateLinkSchema,
  updateAppearanceSchema,
  moveToFolderSchema,
} from './schemas.server';
import { mapLinkToDTO } from '@/lib/mappers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createStaticClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { subDays, subHours, startOfHour, startOfDay, format } from 'date-fns';
import type {
  DateRange as AnalyticsDateRange,
  AnalyticsData,
  ChartDataPoint,
  TopLink,
} from '@/types/analytics';

async function calculateGlobalCounts(userId: string, supabase: SupabaseClient) {
  const { data: allLinks } = await supabase
    .from('links')
    .select('id, is_active, parent_id, is_folder')
    .eq('user_id', userId);

  if (!allLinks) return { globalTotalCount: 0, globalActiveCount: 0 };

  const inactiveFolderIds = new Set(
    allLinks.filter((l) => l.is_folder && !l.is_active).map((l) => l.id),
  );

  const reachableLinksCount = allLinks.filter((l) => {
    if (!l.is_active) return false;
    if (l.parent_id && inactiveFolderIds.has(l.parent_id)) return false;
    return true;
  }).length;

  return {
    globalTotalCount: allLinks.length,
    globalActiveCount: reachableLinksCount,
  };
}

export async function addLink(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = addLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, parentId, animationType } = parsed.data;
  let url = parsed.data.url || '';

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Validate URL scheme to prevent XSS (javascript:, data:, etc.)
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    // Enforce domain format: must have TLD (letters only, 2+ chars)
    if (
      !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(parsedUrl.hostname) &&
      parsedUrl.hostname !== 'localhost'
    ) {
      return { error: 'Invalid URL' };
    }
  } catch {
    return { error: 'Invalid URL format' };
  }

  // Get the highest sort_order and next short_id in parallel
  const [{ data: lastLink }, { data: nextShortId, error: rpcError }] =
    await Promise.all([
      supabase
        .from('links')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single(),
      supabase.rpc('get_next_short_id', { p_user_id: user.id }),
    ]);

  const nextOrder = (lastLink?.sort_order ?? 0) + 1;

  if (rpcError) {
    console.error('Failed to get next short_id:', rpcError);
    return { error: 'Failed to create link' };
  }

  const { error } = await supabase.from('links').insert({
    user_id: user.id,
    title,
    url,
    sort_order: nextOrder,
    short_id: nextShortId,
    parent_id: parentId || null,
    animation_type: animationType || 'none',
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch the created link and the new count for the parent folder
  const [{ data: newLink }, { count: nextCount }] = await Promise.all([
    supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .eq('short_id', nextShortId)
      .single(),
    parentId 
      ? supabase.from('links').select('id', { count: 'exact', head: true }).eq('parent_id', parentId)
      : Promise.resolve({ count: 0 })
  ]);

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true, link: newLink ? mapLinkToDTO(newLink) : null, newCount: nextCount };
}

export async function updateLink(linkId: string, formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const rawData = Object.fromEntries(formData);
  const parsed = updateLinkSchema.safeParse({
    ...rawData,
    isFolder: rawData.isFolder === 'true',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, isFolder, animationType } = parsed.data;
  let url = parsed.data.url || null;

  const updates: { title: string; url?: string; animation_type?: string } = {
    title,
    animation_type: animationType || 'none',
  };

  if (!isFolder && url) {
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // Validate URL scheme to prevent XSS
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { error: 'Only HTTP and HTTPS URLs are allowed' };
      }
      // Enforce domain format: must have TLD (letters only, 2+ chars)
      if (
        !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(parsedUrl.hostname) &&
        parsedUrl.hostname !== 'localhost'
      ) {
        return { error: 'Invalid URL' };
      }
    } catch {
      return { error: 'Invalid URL format' };
    }
    updates.url = url;
  }

  const { error } = await supabase
    .from('links')
    .update(updates)
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  // Fetch the updated link
  const { data: updatedLink } = await supabase
    .from('links')
    .select('*')
    .eq('id', linkId)
    .single();

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true, link: updatedLink };
}

export async function deleteLink(linkId: string) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true };
}

export async function toggleLinkActive(linkId: string, isActive: boolean) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const { error } = await supabase
    .from('links')
    .update({ is_active: isActive })
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true };
}

export async function reorderLinks(linkIds: string[]) {
  const { profile, supabase } = await getAuthenticatedUserAndProfile();

  // Update each link's sort_order atomically via RPC
  const { error } = await supabase.rpc('reorder_links', {
    p_link_ids: linkIds,
  });

  if (error) {
    console.error('Failed to reorder links:', error);
    return { error: 'Failed to reorder links' };
  }

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true };
}

export async function updateAppearance(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = updateAppearanceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const {
    themeName = '',
    buttonStyle = '',
    buttonShape = '',
    socialLinks: socialLinksRaw = '',
    customTheme: customThemeRaw = '',
  } = parsed.data;

  const updateData: {
    theme_name: string;
    button_style: string;
    button_shape: string;
    social_links?: Record<string, string>;
    custom_theme?: Record<string, string> | null;
  } = {
    theme_name: themeName,
    button_style: buttonStyle,
    button_shape: buttonShape,
  };

  if (socialLinksRaw) {
    try {
      updateData.social_links = JSON.parse(socialLinksRaw);
    } catch (e) {
      console.error('Failed to parse social links JSON', e);
    }
  }

  if (themeName === 'custom' && customThemeRaw) {
    try {
      updateData.custom_theme = JSON.parse(customThemeRaw);
    } catch (e) {
      console.error('Failed to parse custom theme JSON', e);
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bio', 'page');
  if (profile) {
    updateTag(`profile-${profile.username}`);
    revalidatePath(`/${profile.username}`, 'page');
  }
  return { success: true };
}

export async function createFolder(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = addLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, parentId, animationType } = parsed.data;

  // Get the highest sort_order and next short_id in parallel
  const [{ data: lastLink }, { data: nextShortId, error: rpcError }] =
    await Promise.all([
      supabase
        .from('links')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single(),
      supabase.rpc('get_next_short_id', { p_user_id: user.id }),
    ]);

  const nextOrder = (lastLink?.sort_order ?? 0) + 1;

  if (rpcError) {
    console.error('Failed to get next short_id:', rpcError);
    return { error: 'Failed to create folder' };
  }

  const { error } = await supabase.from('links').insert({
    user_id: user.id,
    title,
    url: '#', // Folders don't have a real URL
    sort_order: nextOrder,
    short_id: nextShortId,
    is_folder: true,
    parent_id: parentId || null,
    animation_type: animationType || 'none',
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch the created link and the new count for the parent folder
  const [{ data: newFolder }, { count: nextCount }] = await Promise.all([
    supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .eq('short_id', nextShortId)
      .single(),
    parentId 
      ? supabase.from('links').select('id', { count: 'exact', head: true }).eq('parent_id', parentId)
      : Promise.resolve({ count: 0 })
  ]);

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true, link: newFolder ? mapLinkToDTO(newFolder) : null, newCount: nextCount };
}

export async function moveToFolder(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = moveToFolderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { linkId, parentId } = parsed.data;
  const targetParentId = parentId || null;

  // Get the highest sort_order in the target destination
  const { data: lastLink } = await supabase
    .from('links')
    .select('sort_order')
    .eq('user_id', user.id)
    .filter('parent_id', targetParentId === null ? 'is' : 'eq', targetParentId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (lastLink?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from('links')
    .update({ 
      parent_id: targetParentId,
      sort_order: nextOrder 
    })
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true };
}

export async function loadMoreLinks(offset: number, limit: number = 50) {
  const { user, supabase } = await getAuthenticatedUser();
  
  const [{ data, error, count }, { globalTotalCount, globalActiveCount }] = await Promise.all([
    supabase
      .from('links')
      .select('*, children:links(count)', { count: 'exact' })
      .eq('user_id', user.id)
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1),
    calculateGlobalCounts(user.id, supabase),
  ]);
    
  if (error) {
    return { error: error.message };
  }
  
  return { 
    links: (data || []).map(mapLinkToDTO), 
    totalCount: count || 0, // Root count for pagination
    globalTotalCount: globalTotalCount || 0,
    globalActiveCount: globalActiveCount || 0
  };
}

export async function loadFolderLinks(folderId: string, offset: number, limit: number = 50) {
  const { user, supabase } = await getAuthenticatedUser();
  
  const [{ data, error, count }, { globalTotalCount, globalActiveCount }] = await Promise.all([
    supabase
      .from('links')
      .select(
        'id, title, url, is_active, short_id, is_folder, parent_id, sort_order, animation_type, clicks, children:links(count)',
        { count: 'exact' }
      ).eq('user_id', user.id)
      .eq('parent_id', folderId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1),
    calculateGlobalCounts(user.id, supabase),
  ]);
    
  if (error) {
    return { error: error.message };
  }
  
  return { 
    links: (data || []).map(mapLinkToDTO), 
    totalCount: count || 0, // Folder count for pagination
    globalTotalCount: globalTotalCount || 0,
    globalActiveCount: globalActiveCount || 0
  };
}

// ==========================================
// PUBLIC ACTIONS
// ==========================================

export async function loadMorePublicLinks(profileId: string, offset: number, limit: number = 50) {
  const parsed = z.uuid().safeParse(profileId);
  if (!parsed.success) return { error: 'Invalid profile ID' };

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('links')
    .select(
      'id, title, url, is_active, short_id, is_folder, parent_id, sort_order, animation_type, children:links(count)',
    )
    .eq('user_id', profileId)
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return { error: error.message };
  }

  const parsedResult = z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().nullable(),
    is_active: z.boolean(),
    short_id: z.union([z.string(), z.number()]).nullable(),
    is_folder: z.boolean(),
    parent_id: z.string().nullable(),
    sort_order: z.number().nullable(),
    animation_type: z.string().nullable(),
    children: z.array(z.object({ count: z.number() })).optional(),
  })).safeParse(data);

  const rawLinks = parsedResult.success ? parsedResult.data : null;

  return { 
    links: rawLinks ? rawLinks.map((link) => ({
      ...link,
      url: link.url || '',
      is_active: !!link.is_active,
      child_count: link.children?.[0]?.count ?? 0,
    })) : [] 
  };
}

export async function loadMorePublicFolderLinks(profileId: string, folderId: string, offset: number, limit: number = 50) {
  const idSchema = z.uuid();
  const profileParsed = idSchema.safeParse(profileId);
  const folderParsed = idSchema.safeParse(folderId);
  if (!profileParsed.success) return { error: 'Invalid profile ID' };
  if (!folderParsed.success) return { error: 'Invalid folder ID' };

  const supabase = createStaticClient();
  const { data, error, count } = await supabase
    .from('links')
    .select(
      'id, title, url, is_active, short_id, is_folder, parent_id, sort_order, animation_type, children:links(count)',
      { count: 'exact' }
    )
    .eq('user_id', profileId)
    .eq('is_active', true)
    .eq('parent_id', folderId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return { error: error.message };
  }

  const parsedResult = z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().nullable(),
    is_active: z.boolean(),
    short_id: z.union([z.string(), z.number()]).nullable(),
    is_folder: z.boolean(),
    parent_id: z.string().nullable(),
    sort_order: z.number().nullable(),
    animation_type: z.string().nullable(),
    children: z.array(z.object({ count: z.number() })).optional(),
  })).safeParse(data);

  const rawLinks = parsedResult.success ? parsedResult.data : null;

  return { 
    links: rawLinks ? rawLinks.map((link) => ({
      ...link,
      url: link.url || '',
      is_active: !!link.is_active,
      child_count: link.children?.[0]?.count ?? 0,
    })) : [],
    totalFolderLinks: count || 0
  };
}

// ==========================================
// ANALYTICS ACTIONS
// ==========================================

export async function getAnalyticsData(
  range: AnalyticsDateRange,
  linkId?: string | 'all',
): Promise<AnalyticsData> {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: links } = await supabase
    .from('links')
    .select('id, title, url, clicks')
    .eq('user_id', user.id)
    .eq('is_folder', false)
    .order('sort_order', { ascending: true });

  if (!links || links.length === 0) {
    return {
      chartData: [],
      totalClicks: 0,
      totalViews: 0,
      ctr: 0,
      topLinks: [],
      topReferer: null,
      userLinks: [],
    };
  }

  const userLinks = links.map((l) => ({ id: l.id, title: l.title }));

  // Security check: Ensure requested linkId belongs to user
  let targetLinkIds: string[];
  if (linkId && linkId !== 'all') {
    const isOwned = links.some((l) => l.id === linkId);
    if (!isOwned) {
      return {
        chartData: [],
        totalClicks: 0,
        totalViews: 0,
        ctr: 0,
        topLinks: [],
        topReferer: null,
        userLinks,
      };
    }
    targetLinkIds = [linkId];
  } else {
    targetLinkIds = links.map((l) => l.id);
  }

  // Calculate date range
  const now = new Date();
  let startDate: Date | null;
  let bucketInterval: 'hour' | 'day' | 'month';

  switch (range) {
    case '24h':
      startDate = subHours(now, 24);
      bucketInterval = 'hour';
      break;
    case '7d':
      startDate = subDays(now, 7);
      bucketInterval = 'day';
      break;
    case '30d':
      startDate = subDays(now, 30);
      bucketInterval = 'day';
      break;
    case 'lifetime':
      startDate = null;
      bucketInterval = 'month';
      break;
    default:
      startDate = subHours(now, 24);
      bucketInterval = 'hour';
  }

  // Run all four major data-fetching queries in parallel for performance (Fix P1)
  const [chartDataResult, topReferer, topLinks, totalViews] = await Promise.all([
    // 1. Chart Data & Clicks (with fallback wrapper)
    getAggregatedChartData(
      supabase,
      targetLinkIds,
      startDate,
      bucketInterval,
      range,
      now,
    ).then(async (rpcResult) => {
      if (rpcResult.success) {
        return {
          chartData: rpcResult.chartData,
          totalClicks: rpcResult.totalClicks,
        };
      }
      const fallbackResult = await getClientSideAggregation(
        supabase,
        targetLinkIds,
        startDate,
        range,
        now,
      );
      return {
        chartData: fallbackResult.chartData,
        totalClicks: fallbackResult.totalClicks,
      };
    }),

    // 2. Top Referer
    getTopRefererData(supabase, targetLinkIds, startDate),

    // 3. Top Links Analytics
    getTopLinksData(
      supabase,
      links
        .filter((l) => targetLinkIds.includes(l.id))
        .map((l) => ({ ...l, clicks: l.clicks ?? 0 })),
      targetLinkIds,
      startDate,
    ),

    // 4. Total Profile Views
    getTotalProfileViews(supabase, user.id, startDate),
  ]);

  const { chartData, totalClicks } = chartDataResult;

  // Calculate CTR
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  return {
    chartData,
    totalClicks,
    totalViews,
    ctr,
    topLinks,
    topReferer,
    userLinks,
  };
}

// Get total profile views in range
async function getTotalProfileViews(
  supabase: SupabaseClient,
  profileId: string,
  startDate: Date | null,
): Promise<number> {
  let query = supabase
    .from('profile_events')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error fetching profile views:', error);
    return 0;
  }

  return count || 0;
}

// Optimized: Use PostgreSQL RPC for server-side aggregation
async function getAggregatedChartData(
  supabase: SupabaseClient,
  linkIds: string[],
  startDate: Date | null,
  bucketInterval: 'hour' | 'day' | 'month',
  range: AnalyticsDateRange,
  now: Date,
): Promise<{
  success: boolean;
  chartData: ChartDataPoint[];
  totalClicks: number;
}> {
  try {
    const { data, error } = await supabase.rpc('get_analytics_chart_data', {
      p_link_ids: linkIds,
      p_start_date: startDate?.toISOString(),
      p_bucket_interval: bucketInterval,
    });

    if (error) {
      console.error('RPC get_analytics_chart_data error:', error);
      return { success: false, chartData: [], totalClicks: 0 };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        chartData: generateEmptyChartData(range, now),
        totalClicks: 0,
      };
    }

    // Build chart data from RPC results
    const bucketCounts = new Map<string, number>();

    // For lifetime view, start buckets from the first available data point
    let effectiveStartDate: Date | undefined;
    if (range === 'lifetime' && data.length > 0 && data[0].bucket) {
      effectiveStartDate = new Date(data[0].bucket);
    }

    // Initialize empty buckets
    const emptyBuckets = generateEmptyChartData(range, now, effectiveStartDate);
    emptyBuckets.forEach((b) => bucketCounts.set(b.label, 0));

    // Fill with RPC data
    let total = 0;
    data.forEach((row: { bucket: string | null; click_count: number }) => {
      total += row.click_count;

      if (bucketInterval === 'month') {
        // Monthly bucket for lifetime view
        const bucketDate = new Date(row.bucket!);
        const label = format(bucketDate, 'MMM yyyy');
        if (bucketCounts.has(label)) {
          bucketCounts.set(
            label,
            (bucketCounts.get(label) || 0) + row.click_count,
          );
        } else {
          // Add new month if not in initial buckets
          bucketCounts.set(label, row.click_count);
        }
      } else {
        const bucketDate = new Date(row.bucket!);
        let label: string;

        if (bucketInterval === 'hour') {
          label = format(bucketDate, 'HH:00');
        } else if (range === '7d') {
          label = format(bucketDate, 'EEE');
        } else {
          label = format(bucketDate, 'MMM d');
        }

        if (bucketCounts.has(label)) {
          bucketCounts.set(
            label,
            (bucketCounts.get(label) || 0) + row.click_count,
          );
        }
      }
    });

    const chartData = Array.from(bucketCounts.entries()).map(
      ([label, value]) => ({
        label,
        value,
      }),
    );

    return { success: true, chartData, totalClicks: total };
  } catch (err) {
    console.error('RPC call failed:', err);
    return { success: false, chartData: [], totalClicks: 0 };
  }
}

// Fallback: Client-side aggregation (original approach)
async function getClientSideAggregation(
  supabase: SupabaseClient,
  linkIds: string[],
  startDate: Date | null,
  range: AnalyticsDateRange,
  now: Date,
): Promise<{ chartData: ChartDataPoint[]; totalClicks: number }> {
  let query = supabase
    .from('link_events')
    .select('created_at, link_id')
    .in('link_id', linkIds)
    .order('created_at', { ascending: true });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('getClientSideAggregation error:', error);
    return { chartData: generateEmptyChartData(range, now), totalClicks: 0 };
  }

  if (!events || events.length === 0) {
    return { chartData: generateEmptyChartData(range, now), totalClicks: 0 };
  }

  const chartData = groupEventsByTimeBucket(events, range, now);
  return { chartData, totalClicks: events.length };
}

// Get top referer (try RPC first, fallback to client-side)
async function getTopRefererData(
  supabase: SupabaseClient,
  linkIds: string[],
  startDate: Date | null,
): Promise<string | null> {
  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('get_top_referers', {
      p_link_ids: linkIds,
      p_start_date: startDate?.toISOString(),
      p_limit: 1,
    });

    if (error) {
      console.warn(
        'RPC get_top_referers failed, falling back to client-side:',
        error,
      );
    } else if (data && data.length > 0) {
      return data[0].referer_domain || null;
    }
  } catch (err) {
    console.warn('RPC get_top_referers exception:', err);
    // RPC not available, fall through to client-side
  }

  // Fallback: client-side
  let query = supabase
    .from('link_events')
    .select('referer')
    .in('link_id', linkIds);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('getTopRefererData fallback error:', error);
    return null;
  }

  if (!events || events.length === 0) return null;

  const refererCounts: Record<string, number> = {};
  events.forEach((e) => {
    if (e.referer) {
      try {
        const url = new URL(e.referer);
        const domain = url.hostname.replace('www.', '');
        refererCounts[domain] = (refererCounts[domain] || 0) + 1;
      } catch {
        // Invalid URL, ignore
      }
    }
  });

  return (
    Object.entries(refererCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  );
}

// Get top links with click counts in the time range
async function getTopLinksData(
  supabase: SupabaseClient,
  links: { id: string; title: string; url: string; clicks: number }[],
  linkIds: string[],
  startDate: Date | null,
): Promise<TopLink[]> {
  let query = supabase
    .from('link_events')
    .select('link_id')
    .in('link_id', linkIds);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('getTopLinksData error:', error);
    return [];
  }

  const clicksPerLink: Record<string, number> = {};
  if (events) {
    events.forEach((e) => {
      clicksPerLink[e.link_id] = (clicksPerLink[e.link_id] || 0) + 1;
    });
  }

  return links
    .map((l) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      clicks: clicksPerLink[l.id] || 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
}

function generateEmptyChartData(
  range: AnalyticsDateRange,
  now: Date,
  startDate?: Date,
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];

  if (range === '24h') {
    for (let i = 23; i >= 0; i--) {
      const hour = subHours(now, i);
      data.push({ label: format(hour, 'HH:00'), value: 0 });
    }
  } else if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      data.push({ label: format(day, 'EEE'), value: 0 });
    }
  } else if (range === '30d') {
    for (let i = 29; i >= 0; i--) {
      const day = subDays(now, i);
      data.push({ label: format(day, 'MMM d'), value: 0 });
    }
  } else {
    // Lifetime: Monthly buckets
    // If startDate provided (from actual data), start from there.
    // Otherwise default to just current month (instead of empty 12 months)
    let current = startDate ? new Date(startDate) : new Date(now);
    // Normalize to start of month
    current.setDate(1);
    current.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);

    // If start date is in the future relative to our logic (shouldn't happen) or same, just add one bucket
    if (current > end) current = end;

    while (current <= end) {
      data.push({ label: format(current, 'MMM yyyy'), value: 0 });
      // Add 1 month
      current = new Date(current.setMonth(current.getMonth() + 1));
    }
  }

  return data;
}

function groupEventsByTimeBucket(
  events: { created_at: string; link_id: string }[],
  range: AnalyticsDateRange,
  now: Date,
): ChartDataPoint[] {
  const buckets: Map<string, number> = new Map();

  if (range === '24h') {
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(now, i));
      buckets.set(format(hour, 'HH:00'), 0);
    }
  } else if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(now, i));
      buckets.set(format(day, 'EEE'), 0);
    }
  } else if (range === '30d') {
    for (let i = 29; i >= 0; i--) {
      const day = startOfDay(subDays(now, i));
      buckets.set(format(day, 'MMM d'), 0);
    }
  } else {
    buckets.set('All Time', 0);
  }

  events.forEach((event) => {
    const eventDate = new Date(event.created_at);
    let key: string;

    if (range === '24h') {
      key = format(startOfHour(eventDate), 'HH:00');
    } else if (range === '7d') {
      key = format(startOfDay(eventDate), 'EEE');
    } else if (range === '30d') {
      key = format(startOfDay(eventDate), 'MMM d');
    } else {
      key = 'All Time';
    }

    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  });

  return Array.from(buckets.entries()).map(([label, value]) => ({
    label,
    value,
  }));
}
