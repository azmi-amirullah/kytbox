import { redirect } from 'next/navigation';

/**
 * Legacy redirect: /settings → /app/settings
 * Keeps old bookmarks and links working
 */
export default function LegacySettingsRedirect() {
  redirect('/app/settings');
}
