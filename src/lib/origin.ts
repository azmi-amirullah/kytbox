import { env } from '@/env';

/**
 * Origin validation utility for security-critical redirects.
 * Whitelists the canonical site URL and localhost for development.
 */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;

  const isProd = env.NODE_ENV === 'production';
  const normalizedOrigin = origin.replace(/\/$/, '');

  if (!isProd) {
    if (
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('127.0.0.1')
    ) {
      return true;
    }
  }

  const siteUrl = (env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com').replace(/\/$/, '');
  const siteDomain = siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');

  if (
    normalizedOrigin === siteUrl ||
    normalizedOrigin.endsWith(`.${siteDomain}`)
  ) {
    return true;
  }

  return false;
}

/**
 * Gets a safe absolute origin for redirects.
 * Returns the provided origin if allowed, otherwise falls back to the site URL.
 * Ensures the result is always an absolute URL prefix to prevent relative redirect issues.
 */
export function getSafeOrigin(origin: string | null): string {
  const isProd = env.NODE_ENV === 'production';
  const siteUrl = isProd
    ? env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com'
    : 'http://localhost:3000';

  if (origin && isAllowedOrigin(origin)) {
    return origin.replace(/\/$/, '');
  }

  return siteUrl.replace(/\/$/, '');
}
