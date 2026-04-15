'use client';

import dynamic from 'next/dynamic';

const NextTopLoader = dynamic(() => import('nextjs-toploader'), { ssr: false });

export function ClientTopLoader({ nonce }: { nonce: string }) {
  return (
    <NextTopLoader
      color='var(--primary)'
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing='ease'
      speed={200}
      shadow='0 0 10px var(--primary),0 0 5px var(--primary)'
      nonce={nonce}
    />
  );
}
