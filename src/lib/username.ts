/**
 * Username validation and reserved usernames
 * Based on UKIT platform specification (ukit.md)
 */

// Reserved routes that cannot be used as usernames
export const RESERVED_USERNAMES = [
  // --- Platform Routes ---
  'app',
  'bio',
  'settings',
  'dashboard',
  'analytics',
  'list',
  'track',
  'id',
  'lookup',
  'cashflow',

  // --- Auth & Legal ---
  'login',
  'signup',
  'signin',
  'register',
  'auth',
  'callback',
  'update-password',
  'forgot-password',
  'terms',
  'privacy',
  'cookies',
  'legal',
  'compliance',

  // --- Support & Official ---
  'about',
  'help',
  'support',
  'contact',
  'faq',
  'pricing',
  'admin',
  'ukit',
  'official',
  'verified',
  'system',

  // --- Technical & Assets ---
  'api',
  'www',
  'blog',
  'docs',
  'status',
  'health',
  'robots.txt',
  'sitemap',
  'favicon.ico',
  'assets',
  'static',
  '.well-known',
  'security.txt',

  // --- Future-Proofing ---
  'explore',
  'search',
  'discover',
  'notifications',
] as const;

/**
 * Username format rules (from ukit.md):
 * - Lowercase letters a-z
 * - Numbers 0-9
 * - Single hyphen (-), not at start or end
 * - No consecutive hyphens
 * - Length: 3-20 characters
 */
const USERNAME_REGEX = /^[a-z0-9]([a-z0-9-]{0,18}[a-z0-9])?$|^[a-z0-9]{1,2}$/;
const CONSECUTIVE_HYPHENS = /--/;

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUsername(username: string): UsernameValidationResult {
  const normalized = username.toLowerCase().trim();

  // Length check
  if (normalized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (normalized.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' };
  }

  // Reserved username check
  if (
    RESERVED_USERNAMES.includes(
      normalized as (typeof RESERVED_USERNAMES)[number],
    )
  ) {
    return { valid: false, error: 'This username is reserved' };
  }

  // Consecutive hyphens check
  if (CONSECUTIVE_HYPHENS.test(normalized)) {
    return {
      valid: false,
      error: 'Username cannot contain consecutive hyphens',
    };
  }

  // Format check (a-z, 0-9, single hyphen not at start/end)
  if (!USERNAME_REGEX.test(normalized)) {
    return {
      valid: false,
      error:
        'Username can only contain lowercase letters, numbers, and hyphens (not at start or end)',
    };
  }

  return { valid: true };
}

/**
 * Generate a valid username from email prefix
 * Replaces invalid characters with hyphens, removes consecutive hyphens
 */
export function generateUsernameFromEmail(email: string): string {
  const emailPrefix = email.split('@')[0].toLowerCase();

  // Replace invalid chars with hyphen, then clean up
  let username = emailPrefix
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Ensure minimum length
  if (username.length < 3) {
    username = username.padEnd(3, '0');
  }

  // Truncate to max length
  username = username.slice(0, 20);

  // Remove trailing hyphen if truncation created one
  username = username.replace(/-$/, '');

  return username;
}
