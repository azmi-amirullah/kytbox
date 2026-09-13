import Link from 'next/link';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Button } from '@/components/ui/button';

interface UserPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  search?: string;
}

export function UserPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  search,
}: UserPaginationProps) {
  if (totalCount === 0) return null;

  const startIdx = Math.min((page - 1) * pageSize + 1, totalCount);
  const endIdx = Math.min(page * pageSize, totalCount);

  const getPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', targetPage.toString());
    return `/admin/users?${params.toString()}`;
  };

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-4 py-4'>
      <p className='text-sm text-muted-foreground'>
        Showing <span className='font-medium text-foreground'>{startIdx}</span>{' '}
        to <span className='font-medium text-foreground'>{endIdx}</span> of{' '}
        <span className='font-medium text-foreground'>{totalCount}</span> users
      </p>

      <div className='flex items-center gap-2'>
        {page > 1 ? (
          <Button variant='outline' size='sm' asChild className='h-8'>
            <Link href={getPageUrl(page - 1)}>
              <LuChevronLeft className='mr-1 h-4 w-4' />
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant='outline' size='sm' disabled className='h-8'>
            <LuChevronLeft className='mr-1 h-4 w-4' />
            Previous
          </Button>
        )}

        <span className='text-xs font-medium px-2 text-muted-foreground'>
          Page {page} of {totalPages}
        </span>

        {page < totalPages ? (
          <Button variant='outline' size='sm' asChild className='h-8'>
            <Link href={getPageUrl(page + 1)}>
              Next
              <LuChevronRight className='ml-1 h-4 w-4' />
            </Link>
          </Button>
        ) : (
          <Button variant='outline' size='sm' disabled className='h-8'>
            Next
            <LuChevronRight className='ml-1 h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
}
