'use client';

import { useMemo } from 'react';
import { getSocialIcon } from '@/lib/social-icons';

interface LinkButtonProps {
  href: string;
  title: string;
  url: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Client component that captures the original page referrer
 * and appends it to link clicks as ?ref= param for analytics.
 */
export function LinkButton({
  href,
  title,
  url,
  className,
  style,
}: LinkButtonProps) {
  // useMemo ensures we capture referrer once on mount, not on every render
  const finalHref = useMemo(() => {
    if (typeof document === 'undefined' || !document.referrer) {
      return href;
    }

    try {
      const refUrl = new URL(document.referrer);
      const refDomain = refUrl.hostname.replace(/^www\./, '');
      const currentDomain = window.location.hostname.replace(/^www\./, '');

      // Exclude internal referers (same domain) - counts as Direct
      if (refDomain === currentDomain) {
        return href;
      }

      return `${href}?ref=${encodeURIComponent(refDomain)}`;
    } catch {
      return href;
    }
  }, [href]);

  return (
    <a
      href={finalHref}
      target='_blank'
      rel='noopener noreferrer'
      className={className}
      style={style}
    >
      <div className='flex items-center justify-center gap-3'>
        {getSocialIcon(url, 'w-5 h-5 shrink-0')}
        <span className='truncate'>{title}</span>
      </div>
    </a>
  );
}
