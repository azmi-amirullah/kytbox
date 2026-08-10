/**
 * Content Security Policy header builder.
 * Generates a nonce-based CSP string for dynamic per-request enforcement.
 *
 * @see https://nextjs.org/docs/app/guides/content-security-policy
 */

const isDev = process.env.NODE_ENV === 'development';

export function buildCspHeader(nonce: string, allowedOrigins: string[] = []): string {
  const additionalOrigins = allowedOrigins.length > 0 ? ' ' + allowedOrigins.join(' ') : '';
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'sha256-TiyWB4YB4NUrUHDJSqaW0w0OtUb7i0Tddwwo6j0O07c=' 'sha256-HugGj5oR7f2UGBbrPIOJua5vPpKBIJj8354Z6gsKoUQ=' 'sha256-7mu4H06fwDCjmnxxr/xNHyuQC6pLTHr4M2E4jXw5WZs=' https://va.vercel-scripts.com 'wasm-unsafe-eval' ${isDev ? "'unsafe-eval'" : ''};
    worker-src 'self' blob:;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self'${additionalOrigins};
    connect-src 'self' data: https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com${additionalOrigins};
    frame-src 'self' https://www.youtube.com https://open.spotify.com;
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    ${isDev ? '' : 'upgrade-insecure-requests;'}
  `;

  return csp.replace(/\s{2,}/g, ' ').trim();
}

