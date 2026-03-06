'use client';

import { useMemo } from 'react';
import { getSocialIcon } from '@/lib/social-icons';

interface LinkButtonProps {
  href: string;
  title: string;
  url: string;
  subtitle?: React.ReactNode;
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
  subtitle,
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
        <div className='flex flex-col items-center justify-center overflow-hidden'>
          <span className='truncate text-center'>{title}</span>
          {subtitle && (
            <span className='text-xs opacity-70 truncate text-center mt-0.5 leading-none flex items-center justify-center gap-1'>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
