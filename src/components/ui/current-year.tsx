import { connection } from 'next/server';

/**
 * Server-side Current Year component.
 * Uses connection() to stay compatible with Next.js 16's strict cacheComponents/dynamicIO checks
 * while ensuring No-JS and SEO clients get the correct year without hardcoded fallbacks.
 */
export async function CurrentYear() {
  await connection();
  return <>{new Date().getFullYear()}</>;
}
