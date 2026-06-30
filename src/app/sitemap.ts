import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { createStaticClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  // Fetch all public profile usernames for indexing
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username');

  const profileEntries: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${siteConfig.url}/${p.username}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/login`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/signup`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    ...profileEntries,
  ];
}
