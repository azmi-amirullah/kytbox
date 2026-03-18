/**
 * Content Security Policy header builder.
 * Generates a nonce-based CSP string for dynamic per-request enforcement.
 *
 * @see https://nextjs.org/docs/app/guides/content-security-policy
 */

const isDev = process.env.NODE_ENV === 'development';

export function buildCspHeader(nonce: string): string {
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https://va.vercel-scripts.com ${isDev ? "'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co;
    font-src 'self';
    connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com;
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `;

  return csp.replace(/\s{2,}/g, ' ').trim();
}
