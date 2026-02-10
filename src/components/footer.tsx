interface FooterProps {
  variant?: 'landing' | 'dashboard';
}

export function Footer({ variant = 'dashboard' }: FooterProps) {
  const isLanding = variant === 'landing';

  return (
    <footer className='py-6 border-t border-border text-center text-xs text-muted-foreground relative z-10 bg-background/50 backdrop-blur-sm'>
      <p>
        © {new Date().getFullYear()} Kytbox.{' '}
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
    </footer>
  );
}
