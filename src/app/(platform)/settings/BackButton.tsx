'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LuArrowLeft } from 'react-icons/lu';

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant='ghost'
      size='icon'
      className='-ml-2'
      onClick={() => router.back()}
    >
      <LuArrowLeft className='w-5 h-5' />
    </Button>
  );
}
