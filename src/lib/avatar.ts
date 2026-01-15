import MD5 from 'crypto-js/md5';

/**
 * Generate Gravatar URL from email
 * Falls back to identicon if no Gravatar exists
 */
export function getGravatarUrl(email: string, size: number = 200): string {
  const hash = MD5(email.toLowerCase().trim()).toString();

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Get avatar URL - prioritizes custom avatar, falls back to Gravatar
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  email: string,
  size: number = 200
): string {
  if (avatarUrl) {
    return avatarUrl;
  }
  return getGravatarUrl(email, size);
}
