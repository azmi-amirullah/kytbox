import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'Link-Base - Authentication',
  description: 'Login or create an account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background'>
      {/* Theme Toggle */}
      <div className='absolute top-4 right-4 z-20'>
        <ThemeToggle />
      </div>

      {/* Animated Background Elements */}
      <div className='absolute inset-0 z-0'>
        <div className='absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px] animate-blob' />
        <div className='absolute top-[20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-chart-2/10 blur-[100px] animate-blob animation-delay-2000' />
        <div className='absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-chart-5/10 blur-[100px] animate-blob animation-delay-4000' />
      </div>

      {/* Grid Pattern Overlay */}
      <div className='absolute inset-0 z-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[24px_24px] opacity-50'></div>

      {/* Content */}
      <div className='relative z-10 w-full max-w-md p-4'>
        {children}
        <div className='mt-8 text-center text-xs text-muted-foreground'>
          <p>© {new Date().getFullYear()} Link-Base. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
