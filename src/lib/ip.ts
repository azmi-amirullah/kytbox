import { headers } from 'next/headers';

/**
 * Helper to get the client IP address safely for rate limiting.
 * Prioritizes Vercel-specific headers to prevent IP spoofing
 * via the standard x-forwarded-for header.
 */
export async function getIp(): Promise<string> {
  const headersList = await headers();

  // Vercel specific guarantees - prioritize these over generic headers
  const vercelIp = headersList.get('x-vercel-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const forwardedFor = headersList.get('x-forwarded-for');

  if (vercelIp) return vercelIp.split(',')[0].trim();
  if (realIp) return realIp.trim();
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return '127.0.0.1';
}
