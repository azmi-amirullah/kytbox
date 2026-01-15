import { redirect } from 'next/navigation';

// Dashboard is now at /
export default function DashboardPage() {
  redirect('/');
}
