import { env } from '@/env';

/**
 * Helper to safely extract the apex hostname from a site URL string.
 * Strips leading 'www.' or 'app.' prefixes to determine the root domain.
 */
function getApexDomain(urlStr: string): string | null {
  try {
    const url = new URL(urlStr.includes('://') ? urlStr : `https://${urlStr}`);
    const hostname = url.hostname.toLowerCase();

    if (
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname) ||
      !hostname.includes('.') ||
      hostname === 'localhost'
    ) {
      return null;
    }

    return hostname.replace(/^(?:www\.|app\.)/, '');
  } catch {
    return null;
  }
}

/**
 * Origin validation utility for security-critical redirects.
 * Whitelists the canonical site URL, its standard subdomains (app, www), and localhost in dev.
 */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin || typeof origin !== 'string') return false;

  const isProd = process.env.NODE_ENV === 'production';
  const normalizedOrigin = origin.replace(/\/$/, '');

  if (!isProd) {
    try {
      const { hostname, protocol } = new URL(normalizedOrigin);
      if (
        ['http:', 'https:'].includes(protocol) &&
        (hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.endsWith('.localhost'))
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com';
  const siteApex = getApexDomain(siteUrl);

  if (!siteApex) return false;

  try {
    const parsedOrigin = new URL(normalizedOrigin);
    const siteOrigin = new URL(
      siteUrl.includes('://') ? siteUrl : `https://${siteUrl}`,
    );

    if (
      !['http:', 'https:'].includes(parsedOrigin.protocol) ||
      parsedOrigin.pathname !== '/' ||
      parsedOrigin.search ||
      parsedOrigin.hash ||
      parsedOrigin.protocol !== siteOrigin.protocol ||
      parsedOrigin.port !== siteOrigin.port
    ) {
      return false;
    }

    const originHostname = parsedOrigin.hostname.toLowerCase();

    return (
      originHostname === siteApex ||
      originHostname === `app.${siteApex}` ||
      originHostname === `www.${siteApex}`
    );
  } catch {
    return false;
  }
}

/**
 * Safely resolves the cookie domain for production cross-subdomain authentication.
 * Returns undefined if in development or if the domain is localhost/IP address.
 */
export function getCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com';
  const apexDomain = getApexDomain(siteUrl);

  return apexDomain ? `.${apexDomain}` : undefined;
}

/**
 * Gets a safe absolute origin for redirects.
 * Returns the provided origin if allowed, otherwise falls back to the site URL.
 * Ensures the result is always an absolute URL prefix to prevent relative redirect issues.
 */
export function getSafeOrigin(origin: string | null): string {
  const isProd = process.env.NODE_ENV === 'production';
  const siteUrl = isProd
    ? env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com'
    : 'http://localhost:3000';

  if (origin && isAllowedOrigin(origin)) {
    return origin.replace(/\/$/, '');
  }

  return siteUrl.replace(/\/$/, '');
}
