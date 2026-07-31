import { isAllowedOrigin, getSafeOrigin, getCookieDomain } from '@/lib/origin';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let mockSiteUrl = 'https://kytbox.com';

vi.mock('@/env', () => ({
  env: {
    get NODE_ENV() {
      return process.env.NODE_ENV || 'production';
    },
    get NEXT_PUBLIC_SITE_URL() {
      return mockSiteUrl;
    },
  },
}));

describe('isAllowedOrigin', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockSiteUrl = 'https://kytbox.com';
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

  it('rejects unsafe protocols for localhost in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAllowedOrigin('javascript://localhost:3000')).toBe(false);
    expect(isAllowedOrigin('data://localhost:3000')).toBe(false);
  });

  it('rejects external malicious domains', () => {
    expect(isAllowedOrigin('https://malicious.com')).toBe(false);
    expect(isAllowedOrigin('https://kytbox.com.evil.com')).toBe(false);
  });

  it('rejects unsafe protocols and non-origin URL components', () => {
    expect(isAllowedOrigin('javascript://kytbox.com')).toBe(false);
    expect(isAllowedOrigin('data://kytbox.com')).toBe(false);
    expect(isAllowedOrigin('https://kytbox.com/path')).toBe(false);
    expect(isAllowedOrigin('https://kytbox.com/?next=/app')).toBe(false);
  });

  it('requires the configured production protocol and port', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isAllowedOrigin('http://kytbox.com')).toBe(false);
    expect(isAllowedOrigin('https://kytbox.com:444')).toBe(false);
  });

  it('accepts multi-segment site URLs correctly', () => {
    mockSiteUrl = 'https://company.co.uk';
    expect(isAllowedOrigin('https://company.co.uk')).toBe(true);
    expect(isAllowedOrigin('https://app.company.co.uk')).toBe(true);
    expect(isAllowedOrigin('https://www.company.co.uk')).toBe(true);
    expect(isAllowedOrigin('https://evil.co.uk')).toBe(false);

    mockSiteUrl = 'https://myapp.vercel.app';
    expect(isAllowedOrigin('https://myapp.vercel.app')).toBe(true);
    expect(isAllowedOrigin('https://app.myapp.vercel.app')).toBe(true);
    expect(isAllowedOrigin('https://www.myapp.vercel.app')).toBe(true);
    expect(isAllowedOrigin('https://evil.vercel.app')).toBe(false);
  });
});

describe('getSafeOrigin', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockSiteUrl = 'https://kytbox.com';
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

describe('getCookieDomain', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockSiteUrl = 'https://kytbox.com';
  });

  it('returns undefined if not in production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getCookieDomain()).toBeUndefined();
  });

  it('returns cookie domain in production for standard domains', () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockSiteUrl = 'https://kytbox.com';
    expect(getCookieDomain()).toBe('.kytbox.com');

    mockSiteUrl = 'https://www.kytbox.com';
    expect(getCookieDomain()).toBe('.kytbox.com');

    mockSiteUrl = 'https://app.kytbox.com';
    expect(getCookieDomain()).toBe('.kytbox.com');
  });

  it('returns cookie domain in production for multi-segment domains', () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockSiteUrl = 'https://company.co.uk';
    expect(getCookieDomain()).toBe('.company.co.uk');

    mockSiteUrl = 'https://app.company.co.uk';
    expect(getCookieDomain()).toBe('.company.co.uk');

    mockSiteUrl = 'https://myapp.vercel.app';
    expect(getCookieDomain()).toBe('.myapp.vercel.app');
  });

  it('returns undefined for localhost or IP addresses', () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockSiteUrl = 'http://localhost:3000';
    expect(getCookieDomain()).toBeUndefined();

    mockSiteUrl = 'http://127.0.0.1:3000';
    expect(getCookieDomain()).toBeUndefined();
  });
});
