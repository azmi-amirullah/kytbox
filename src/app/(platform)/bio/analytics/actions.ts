'use server';

import { subDays, subHours, startOfHour, startOfDay, format } from 'date-fns';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type {
  DateRange,
  AnalyticsData,
  ChartDataPoint,
  TopLink,
} from '@/types/analytics';

export async function getAnalyticsData(
  range: DateRange,
  linkId?: string | 'all',
): Promise<AnalyticsData> {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

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
  const [chartDataResult, topReferer, topLinks, totalViews] = await Promise.all(
    [
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
        links.filter((l) => targetLinkIds.includes(l.id)),
        targetLinkIds,
        startDate,
      ),

      // 4. Total Profile Views
      getTotalProfileViews(supabase, user.id, startDate),
    ],
  );

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
  supabase: Awaited<ReturnType<typeof createClient>>,
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  linkIds: string[],
  startDate: Date | null,
  bucketInterval: 'hour' | 'day' | 'month',
  range: DateRange,
  now: Date,
): Promise<{
  success: boolean;
  chartData: ChartDataPoint[];
  totalClicks: number;
}> {
  try {
    const { data, error } = await supabase.rpc('get_analytics_chart_data', {
      p_link_ids: linkIds,
      p_start_date: startDate?.toISOString() ?? null,
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  linkIds: string[],
  startDate: Date | null,
  range: DateRange,
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  linkIds: string[],
  startDate: Date | null,
): Promise<string | null> {
  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('get_top_referers', {
      p_link_ids: linkIds,
      p_start_date: startDate?.toISOString() ?? null,
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
  supabase: Awaited<ReturnType<typeof createClient>>,
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
  range: DateRange,
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
  range: DateRange,
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
