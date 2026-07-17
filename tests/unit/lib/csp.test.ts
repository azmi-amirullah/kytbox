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
});
