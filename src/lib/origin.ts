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
    try {
      const { hostname } = new URL(normalizedOrigin);
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.localhost')
      ) {
        return true;
      }
    } catch {
      // malformed origin — deny
    }
  }

  const siteUrl = (env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com').replace(/\/$/, '');
  let siteDomain = '';
  try {
    const hostname = new URL(siteUrl).hostname;
    const parts = hostname.split('.');
    siteDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname.replace(/^www\./, '');
  } catch {
    siteDomain = siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  try {
    const { hostname } = new URL(normalizedOrigin);
    if (
      hostname === siteDomain ||
      hostname === `app.${siteDomain}` ||
      hostname === `www.${siteDomain}`
    ) {
      return true;
    }
  } catch {
    // malformed origin
  }

  return false;
}

/**
 * Safely resolves the cookie domain for production cross-subdomain authentication.
 * Returns undefined if in development or if the domain is localhost/IP address.
 */
export function getCookieDomain(): string | undefined {
  if (env.NODE_ENV !== 'production') return undefined;

  try {
    const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com';
    const hostname = new URL(siteUrl).hostname;

    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
    if (!hostname.includes('.') || isIP || hostname === 'localhost') {
      return undefined;
    }

    const parts = hostname.split('.');
    const apexDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname.replace(/^www\./, '');

    return `.${apexDomain}`;
  } catch {
    return undefined;
  }
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

