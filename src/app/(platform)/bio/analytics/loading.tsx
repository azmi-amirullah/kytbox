import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { PlatformHeaderSkeleton } from '@/components/skeletons/platform-header-skeleton';
import { LuChevronRight, LuArrowLeft } from 'react-icons/lu';

export default function Loading() {
  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />
      <PlatformHeaderSkeleton />

      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8 flex-1 w-full'>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex flex-col gap-6'>
            <div>
              <nav className='flex items-center gap-1 text-sm text-muted-foreground mb-4'>
                <span className='hover:text-foreground transition-colors'>
                  Kytbox
                </span>
                <LuChevronRight className='w-3 h-3' />
                <span className='hover:text-foreground transition-colors'>
                  Bio
                </span>
                <LuChevronRight className='w-3 h-3' />
                <span className='text-foreground font-medium'>Analytics</span>
              </nav>

              <div className='flex items-center gap-4 mb-2'>
                <div className='-ml-2 w-9 h-9 flex items-center justify-center'>
                  <LuArrowLeft className='w-5 h-5 text-muted-foreground' />
                </div>
                <h1 className='text-3xl font-bold tracking-tight'>Analytics</h1>
              </div>

              <p className='text-muted-foreground'>
                Track your link performance and audience engagement.
              </p>
            </div>

            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4'>
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto w-full sm:w-auto'>
                <Skeleton className='h-10 w-full sm:w-[200px]' />
                <Skeleton className='h-10 w-full sm:w-[140px]' />
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='p-6 bg-card rounded-xl border shadow-sm'>
                <Skeleton className='h-4 w-24 mb-2' />
                <Skeleton className='h-8 w-16 mb-1' />
                <Skeleton className='h-3 w-20 mt-1' />
              </div>
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className='rounded-xl border bg-card shadow-sm p-6 h-[330px]'>
            <div className='mb-4'>
              <div className='flex items-center justify-between mb-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-32' />
              </div>
              <Skeleton className='h-8 w-24 mt-1' />
            </div>
            <Skeleton className='h-[210px] w-full rounded-lg' />
          </div>

          {/* Table Skeleton */}
          <div className='rounded-xl border bg-card shadow-sm overflow-hidden p-6'>
            <div className='border-b pb-4'>
              <Skeleton className='h-5 w-40' />
            </div>
            <div className='p-0'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    <th className='h-10 px-4 text-left'>
                      <Skeleton className='h-4 w-16' />
                    </th>
                    <th className='h-10 px-4 text-left hidden md:table-cell'>
                      <Skeleton className='h-4 w-8' />
                    </th>
                    <th className='h-10 px-4 text-right'>
                      <Skeleton className='h-4 w-12 ml-auto' />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className='border-b last:border-0'>
                      <td className='p-4'>
                        <Skeleton className='h-4 w-24' />
                      </td>
                      <td className='p-4 hidden md:table-cell'>
                        <Skeleton className='h-4 w-32' />
                      </td>
                      <td className='p-4 text-right'>
                        <Skeleton className='h-4 w-8 ml-auto' />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
