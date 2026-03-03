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
