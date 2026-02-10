import { LuSparkles } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className='bg-primary/10 p-2 rounded-xl'>
        <LuSparkles className='w-5 h-5 text-primary' />
      </div>
      <span className='font-bold text-lg tracking-tight cursor-pointer select-none'>
        Kytbox
      </span>
    </div>
  );
}
