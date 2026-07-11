'use client';

import { UpdatePasswordForm } from '@/features/auth';

export default function UpdatePasswordPage() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-linear-to-b from-background to-background/80'>
      <div className='absolute inset-0 z-0 pointer-events-none'>
        <div className='absolute top-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]' />
        <div className='absolute bottom-[10%] right-[20%] h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[100px]' />
      </div>

      <UpdatePasswordForm />
    </div>
  );
}
