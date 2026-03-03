import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required'),
    UPSTASH_REDIS_REST_URL: z
      .string()
      .url('UPSTASH_REDIS_REST_URL must be a valid URL'),
    UPSTASH_REDIS_REST_TOKEN: z
      .string()
      .min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z
      .string()
      .min(1, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is required'),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  },
  // Optional: Skip validation when building if needed (default ignores the build env)
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
