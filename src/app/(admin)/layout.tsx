import { requireAdmin } from '@/lib/admin';

import { ReactNode } from 'react';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className='min-h-screen bg-background font-sans antialiased'>
      <div className='border-b bg-slate-900 text-white px-4 py-3 flex items-center justify-between'>
        <div className='font-bold tracking-tight flex items-center gap-2'>
          <div className='bg-red-500 rounded px-1.5 py-0.5 text-xs uppercase font-bold text-white'>
            Admin
          </div>
          Kytbox
        </div>
        <div className='text-sm text-slate-400'>You are in Admin Mode</div>
      </div>
      <main>{children}</main>
    </div>
  );
}
