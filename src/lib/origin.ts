/**
 * Origin validation utility for security-critical redirects.
 * Whitelists the canonical site URL and localhost for development.
 */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;

  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    !isProd && 'http://localhost:3000',
    !isProd && 'http://127.0.0.1:3000',
  ].filter(Boolean) as string[];

  // Normalize origin (remove trailing slash)
  const normalizedOrigin = origin.replace(/\/$/, '');

  return allowedOrigins.some((allowed) => {
    const normalizedAllowed = allowed.replace(/\/$/, '');
    return normalizedOrigin === normalizedAllowed;
  });
}

/**
 * Gets a safe absolute origin for redirects.
 * Returns the provided origin if allowed, otherwise falls back to the site URL.
 * Ensures the result is always an absolute URL prefix to prevent relative redirect issues.
 */
export function getSafeOrigin(origin: string | null): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com';

  if (origin && isAllowedOrigin(origin)) {
    return origin.replace(/\/$/, '');
  }

  return siteUrl.replace(/\/$/, '');
}
