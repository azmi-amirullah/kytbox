/**
 * Get avatar URL - returns custom avatar or null
 * UI components should handle null by displaying initials
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
): string | null {
  return avatarUrl || null;
}
