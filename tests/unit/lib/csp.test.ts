import { buildCspHeader } from '@/lib/csp';
import { describe, it, expect } from 'vitest';

describe('buildCspHeader', () => {
  it('generates a policy containing the nonce', () => {
    const nonce = 'test-nonce-value';
    const csp = buildCspHeader(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
  });

  it('sets standard security rules', () => {
    const csp = buildCspHeader('nonce');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it('includes additional allowed origins in connect-src', () => {
    const allowed = ['https://app.example.com', 'https://example.com'];
    const csp = buildCspHeader('nonce', allowed);
    expect(csp).toContain("connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com https://app.example.com https://example.com;");
  });
});
