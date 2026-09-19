import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { DataVaultView, getDataVaultTelemetry } from '@/features/settings';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

export const metadata: Metadata = {
  title: 'Account Data Vault | Settings',
  robots: { index: false, follow: false },
};

export default async function DataVaultPage() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    redirect('/onboarding');
  }

  const telemetry = await getDataVaultTelemetry();

  return (
    <div className='max-w-3xl mx-auto px-4 py-8 w-full'>
      <div className='space-y-1.5 sm:space-y-2 mb-6'>
        <BreadcrumbNav />
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Account Data Vault
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage data sovereignty, download 1-click JSON backups, or export your complete workspace archive.
          </p>
        </div>
      </div>
      <DataVaultView telemetry={telemetry} />
    </div>
  );
}
