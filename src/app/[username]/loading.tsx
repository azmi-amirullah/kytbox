import { BrandLoader } from '@/components/ui/brand-loader';

export default function Loading() {
  return (
    <div className='min-h-screen w-full flex items-center justify-center bg-background'>
      <BrandLoader />
    </div>
  );
}
