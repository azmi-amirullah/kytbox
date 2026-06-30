import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/bio/', '/cashflow/', '/settings/', '/support/', '/onboarding/', '/update-password/', '/auth/'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
