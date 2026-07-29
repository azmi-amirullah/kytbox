import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-11 items-center gap-2.5', className)}>
      <Image
        src='/icon.png'
        alt=''
        width={36}
        height={36}
        className='size-9 rounded-xl object-cover shadow-sm'
        aria-hidden='true'
      />
      <span className='select-none text-lg font-semibold tracking-[-0.04em]'>Kytbox</span>
    </div>
  )
}
