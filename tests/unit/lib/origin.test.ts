import { isAllowedOrigin, getSafeOrigin } from '@/lib/origin';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    get NODE_ENV() {
      return process.env.NODE_ENV || 'production';
    },
    NEXT_PUBLIC_SITE_URL: 'https://kytbox.com',
  },
}));

describe('isAllowedOrigin', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects empty or null origin', () => {
    expect(isAllowedOrigin('')).toBe(false);
    // @ts-expect-error - testing invalid parameter type
    expect(isAllowedOrigin(null)).toBe(false);
  });

  it('accepts exact NEXT_PUBLIC_SITE_URL', () => {
    expect(isAllowedOrigin('https://kytbox.com')).toBe(true);
  });

  it('accepts NEXT_PUBLIC_SITE_URL with trailing slash', () => {
    expect(isAllowedOrigin('https://kytbox.com/')).toBe(true);
  });

  it('rejects localhost in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isAllowedOrigin('http://localhost:3000')).toBe(false);
  });

  it('accepts localhost in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
    expect(isAllowedOrigin('http://app.localhost:3000')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(true);
  });

  it('rejects external malicious domains', () => {
    expect(isAllowedOrigin('https://malicious.com')).toBe(false);
    expect(isAllowedOrigin('https://kytbox.com.evil.com')).toBe(false);
  });
});

describe('getSafeOrigin', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns normalized allowed origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSafeOrigin('https://kytbox.com/')).toBe('https://kytbox.com');
  });

  it('falls back to site URL for disallowed origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSafeOrigin('https://evil.com')).toBe('https://kytbox.com');
    expect(getSafeOrigin(null)).toBe('https://kytbox.com');
  });

  it('returns allowed local origins in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getSafeOrigin('http://localhost:3000/')).toBe('http://localhost:3000');
    expect(getSafeOrigin('http://app.localhost:3000/')).toBe('http://app.localhost:3000');
  });

  it('falls back to localhost for disallowed origin in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getSafeOrigin('https://evil.com')).toBe('http://localhost:3000');
    expect(getSafeOrigin(null)).toBe('http://localhost:3000');
  });
});
