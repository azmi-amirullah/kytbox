import { getAuthenticatedUser } from '@/lib/auth';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { actionRateLimit } from '@/lib/upstash/redis';

/**
 * Wraps getAuthenticatedUser() with a global action rate limit (60 req/min per user).
 * Use this in server actions that mutate data. Read-only queries can skip it.
 */
export async function getAuthenticatedUserWithRateLimit() {
  const result = await getAuthenticatedUser();

  const { success } = await actionRateLimit.limit(result.user.id);
  if (!success) {
    throw new Error('Too many requests. Please slow down.');
  }

  return result;
}

/**
 * Same as above but also returns the user's profile.
 */
export async function getAuthenticatedUserAndProfileWithRateLimit() {
  const result = await getAuthenticatedUserAndProfile();

  const { success } = await actionRateLimit.limit(result.user.id);
  if (!success) {
    throw new Error('Too many requests. Please slow down.');
  }

  return result;
}
