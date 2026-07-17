import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { Header } from '@/components/header';
import { BrandLoader } from '@/components/ui/brand-loader';

export default function Loading() {
  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />
      <Header variant='dashboard' />

      <main className='relative z-10 max-w-7xl mx-auto px-4 mt-16 py-8 flex-1 w-full flex items-center justify-center'>
        <BrandLoader />
      </main>

      <Footer />
    </div>
  );
}
