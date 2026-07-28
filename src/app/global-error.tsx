'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('Global Application Error:', error);
    Sentry.captureException(error, {
      tags: { boundary: 'global' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#ffffff',
          color: '#111827',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <main
          role='alert'
          style={{
            boxSizing: 'border-box',
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <section style={{ maxWidth: '480px' }}>
            <div
              aria-hidden='true'
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 20px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '999px',
                background: '#fee2e2',
                color: '#b91c1c',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              !
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: '28px' }}>
              Something went wrong
            </h1>
            <p style={{ margin: '0 0 24px', color: '#4b5563', lineHeight: 1.6 }}>
              We could not load Kytbox. Please try again or contact support if
              the problem continues.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <button
                type='button'
                onClick={unstable_retry}
                style={{
                  border: 0,
                  borderRadius: '999px',
                  padding: '12px 24px',
                  background: '#111827',
                  color: '#ffffff',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontWeight: 600,
                }}
              >
                Try again
              </button>
              <a
                href='mailto:support@kytbox.com'
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  padding: '12px 24px',
                  color: '#111827',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Contact support
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
