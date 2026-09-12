import type { Metadata } from 'next';
import { CreateSplitGroupLanding } from '@/features/cashflow';

export const metadata: Metadata = {
  title: 'Zero-Signup Shared Expense Splitter | Kytbox',
  description:
    'Split vacation bills, group dinners, and roommate expenses with friends. No accounts or downloads required.',
};

export default function SplitLandingPage() {
  return (
    <main className='min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-muted/20'>
      <div className='w-full max-w-lg'>
        <CreateSplitGroupLanding />
      </div>
    </main>
  );
}
