import Link from 'next/link';
import { CurrentYear } from '@/components/ui/current-year';

interface FooterProps {
  variant?: 'landing' | 'dashboard';
}

export function Footer({ variant = 'dashboard' }: FooterProps) {
  const isLanding = variant === 'landing';

  return (
    <footer className='py-6 border-t border-border text-center text-xs text-muted-foreground relative z-10 bg-background/50 backdrop-blur-sm'>
      <p>
        © <CurrentYear /> Kytbox.{' '}
        {isLanding ? (
          'All rights reserved.'
        ) : (
          <>
            Built by{' '}
            <a
              href='https://azmi-dev.vercel.app'
              target='_blank'
              rel='noopener noreferrer'
              className='hover:text-primary transition-colors underline underline-offset-2'
            >
              Azmi
            </a>
            .
          </>
        )}
      </p>
      <div className='mt-2 flex justify-center gap-4 text-xs text-muted-foreground/60'>
        <Link href='/terms' className='hover:text-foreground transition-colors'>
          Terms
        </Link>
        <Link
          href='/privacy'
          className='hover:text-foreground transition-colors'
        >
          Privacy
        </Link>
        <Link
          href='/refund'
          className='hover:text-foreground transition-colors'
        >
          Refund
        </Link>
      </div>
    </footer>
  );
}
