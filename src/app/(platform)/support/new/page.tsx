import { CreateTicketForm } from '@/features/support';
import { createClient } from '@/lib/supabase/server';
import { LuArrowLeft } from 'react-icons/lu';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function NewTicketPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='mb-6'>
        <Link
          href='/support'
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4'
        >
          <LuArrowLeft className='mr-2 h-4 w-4' />
          Back to Support
        </Link>
        <h1 className='text-3xl font-bold tracking-tight'>
          New Support Ticket
        </h1>
        <p className='text-muted-foreground mt-1'>
          We typically respond within 24 hours.
        </p>
      </div>

      <CreateTicketForm />
    </div>
  );
}
