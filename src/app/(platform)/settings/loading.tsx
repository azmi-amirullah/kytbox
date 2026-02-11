import { Skeleton } from '@/components/ui/skeleton';
import { LuChevronRight } from 'react-icons/lu';

export default function Loading() {
  return (
    <div className='max-w-2xl mx-auto px-4 py-8 w-full'>
      {/* Header Section */}
      <div className='mb-6'>
        <nav className='flex items-center gap-1 text-sm text-muted-foreground mb-4'>
          <Skeleton className='h-4 w-12' />
          <LuChevronRight className='w-3 h-3 opacity-50' />
          <Skeleton className='h-4 w-16' />
        </nav>

        <div className='flex items-center gap-4 mb-2'>
          <Skeleton className='h-10 w-10 rounded-md' />
          <Skeleton className='h-9 w-64' />
        </div>

        <Skeleton className='h-5 w-48' />
      </div>

      {/* Avatar Section Skeleton */}
      <div className='space-y-6'>
        <div className='rounded-xl border bg-card text-card-foreground shadow-sm'>
          <div className='flex flex-col space-y-1.5 p-6'>
            <Skeleton className='h-6 w-32' />
            <Skeleton className='h-4 w-48' />
          </div>
          <div className='p-6 pt-0'>
            <div className='flex items-center gap-6'>
              <Skeleton className='w-24 h-24 rounded-full' />
              <div className='flex flex-col gap-2'>
                <Skeleton className='h-9 w-32' />
                <Skeleton className='h-3 w-48' />
              </div>
            </div>
          </div>
        </div>

        {/* Form Section Skeleton */}
        <div className='rounded-xl border bg-card text-card-foreground shadow-sm'>
          <div className='flex flex-col space-y-1.5 p-6'>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-4 w-56' />
          </div>
          <div className='p-6 pt-0 space-y-4'>
            {/* Email */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-12' />
              <Skeleton className='h-10 w-full' />
            </div>

            {/* Username */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-20' />
              <div className='flex gap-0'>
                <div className='w-[70px] bg-muted rounded-l-md border border-r-0 border-input' />
                <Skeleton className='h-10 flex-1 rounded-l-none' />
              </div>
            </div>

            {/* Display Name */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-10 w-full' />
            </div>

            {/* Bio */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-8' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-3 w-12 ml-auto' />
            </div>

            {/* Submit Button */}
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
      </div>
    </div>
  );
}
