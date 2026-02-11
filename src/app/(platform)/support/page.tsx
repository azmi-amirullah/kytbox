import { TicketList } from '@/app/(platform)/support/components/TicketList';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { LuPlus } from 'react-icons/lu';
import Link from 'next/link';

export const metadata = {
  title: 'Support | Kytbox',
  description: 'Manage your support tickets.',
};

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Layout handles redirect usually
  }

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Support</h1>
          <p className='text-muted-foreground mt-1'>
            View your ticket history or create a new request.
          </p>
        </div>
        <Button asChild>
          <Link href='/support/new'>
            <LuPlus className='mr-2 h-4 w-4' />
            New Ticket
          </Link>
        </Button>
      </div>

      <TicketList tickets={tickets || []} />
    </div>
  );
}
