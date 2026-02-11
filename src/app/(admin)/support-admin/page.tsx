import { AdminTicketList } from '@/app/(admin)/support-admin/components/AdminTicketList';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Admin Support | Kytbox',
};

export default async function AdminSupportPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, profiles(username, avatar_url)')
    .order('urgency_score', { ascending: false }) // Sort by Urgency!
    .order('created_at', { ascending: true }); // Then oldest first

  return (
    <div className='max-w-6xl mx-auto py-8 px-4'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Support Queue</h1>
          <p className='text-muted-foreground mt-1'>
            Prioritize tickets based on urgency score.
          </p>
        </div>
      </div>

      <AdminTicketList tickets={tickets || []} />
    </div>
  );
}
