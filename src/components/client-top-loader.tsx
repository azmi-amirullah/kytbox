'use client';

import * as React from 'react';
import NextTopLoader from 'nextjs-toploader';
import '@/sentry.client.config';

export function ClientTopLoader({ nonce }: { nonce: string }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <NextTopLoader
      color='var(--primary)'
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      showForHashAnchor={false}
      easing='ease'
      speed={200}
      shadow='0 0 10px var(--primary),0 0 5px var(--primary)'
      nonce={nonce}
    />
  );
}
