import Link from 'next/link';
import { BackgroundBlobs } from '@/components/background-blobs';
import { Button } from '@/components/ui/button';
import { LuHouse } from 'react-icons/lu';

export default function NotFound() {
  return (
    <div className='min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-background'>
      <BackgroundBlobs />

      <div className='relative z-10 w-full max-w-md text-center space-y-8'>
        <div className='space-y-2'>
          <h1 className='text-[150px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-primary/50 to-primary/10 select-none'>
            404
          </h1>
          <h2 className='text-2xl font-bold tracking-tight'>Page not found</h2>
          <p className='text-muted-foreground'>
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>
        </div>

        <div className='flex items-center justify-center gap-4'>
          <Link href='/'>
            <Button
              size='lg'
              className='gap-2 shadow-lg hover:shadow-primary/25 transition-all'
            >
              <LuHouse className='w-4 h-4' />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
