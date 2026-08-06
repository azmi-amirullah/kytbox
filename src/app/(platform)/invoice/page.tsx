import type { Metadata } from 'next';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { getInvoicesByUserId, getInvoiceStatsByUserId, InvoiceHub } from '@/features/invoice';

export const metadata: Metadata = {
  title: 'Invoices',
  robots: { index: false, follow: false },
};

export default async function InvoicePage() {
  const { user, profile } = await getAuthenticatedUserAndProfile();

  const [invoices, stats] = await Promise.all([
    getInvoicesByUserId(user.id),
    getInvoiceStatsByUserId(user.id),
  ]);

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <InvoiceHub
        initialInvoices={invoices}
        initialStats={stats}
        defaultCurrency={profile?.default_currency || 'USD'}
      />
    </div>
  );
}
