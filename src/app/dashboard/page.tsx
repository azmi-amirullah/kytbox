import { redirect } from 'next/navigation';

/**
 * Legacy redirect: /dashboard → /app/bio
 * Keeps old bookmarks and links working
 */
export default function LegacyDashboardRedirect() {
  redirect('/app/bio');
}
