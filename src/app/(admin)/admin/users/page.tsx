import { Metadata } from 'next';
import {
  getAdminUsersOverview,
  UserDirectoryTable,
  UserSearchFilter,
  UserPagination,
} from '@/features/admin';

export const metadata: Metadata = {
  title: 'User Directory | Admin | Kytbox',
};

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const resolvedParams = await searchParams;
  const data = await getAdminUsersOverview(resolvedParams);

  return (
    <div className='max-w-7xl mx-auto py-8 px-4 space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            User Directory
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Overview of registered users and platform resource utilization.
          </p>
        </div>
        <UserSearchFilter />
      </div>

      <UserDirectoryTable users={data.users} />

      <UserPagination
        page={data.page}
        totalPages={data.totalPages}
        totalCount={data.totalCount}
        pageSize={data.pageSize}
        search={resolvedParams.search}
      />
    </div>
  );
}
