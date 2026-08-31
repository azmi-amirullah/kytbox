import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { env } from '@/env';

// Initialize Redis client with environment variables
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Create a rate limiter for redirect endpoints (10 requests per 10 seconds)
export const redirectRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10s'),
  analytics: true,
  prefix: '@kytbox/redirect-ratelimit',
});

// Create a rate limiter for sensitive auth actions (5 requests per min)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1m'),
  analytics: true,
  prefix: '@kytbox/auth-ratelimit',
});

// Create a rate limiter for username validation (30 requests per min)
export const usernameRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1m'),
  analytics: true,
  prefix: '@kytbox/username-ratelimit',
});

// Global rate limiter for authenticated server actions (60 requests per min per user)
export const actionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1m'),
  analytics: true,
  prefix: '@kytbox/action-ratelimit',
});

// Rate limiter for file uploads (10 uploads per min per user)
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1m'),
  analytics: true,
  prefix: '@kytbox/upload-ratelimit',
});

// Rate limiter for bio subscriptions (5 requests per min per IP)
export const subscribeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1m'),
  analytics: true,
  prefix: '@kytbox/subscribe-ratelimit',
});

// Rate limiter for GDPR data export (5 requests per hour per user)
export const exportRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1h'),
  analytics: true,
  prefix: '@kytbox/export-ratelimit',
});

/**
 * Helper to check rate limits while automatically bypassing during tests/E2E runs.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
) {
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.PLAYWRIGHT === 'true' ||
    process.env.CI
  ) {
    return { success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 };
  }
  return limiter.limit(identifier);
}

