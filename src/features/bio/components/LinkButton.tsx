'use client';

import { useMemo, useState } from 'react';
import { getSocialIcon } from '@/components/ui/social-icons';
import { getFaviconUrl } from '../utils/favicon';
import { cn } from '@/lib/utils';

interface LinkButtonProps {
  href: string;
  title: string;
  url: string;
  iconUrl?: string | null;
  subtitle?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  animationType?: string | null;
  gridSize?: '1x1' | '1x2' | '2x2' | 'full' | null;
}

/**
 * Client component that captures the original page referrer
 * and appends it to link clicks as ?ref= param for analytics.
 */
export function LinkButton({
  href,
  title,
  url,
  iconUrl,
  subtitle,
  className,
  style,
  animationType,
  gridSize,
}: LinkButtonProps) {
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const currentImgUrl = useMemo(() => {
    if (iconUrl && iconUrl.trim().length > 0 && !failedUrls[iconUrl.trim()]) {
      return iconUrl.trim();
    }
    const autoFavicon = getFaviconUrl(url);
    if (autoFavicon && !failedUrls[autoFavicon]) {
      return autoFavicon;
    }
    return null;
  }, [url, iconUrl, failedUrls]);

  const handleImageError = () => {
    if (currentImgUrl) {
      setFailedUrls((prev) => ({ ...prev, [currentImgUrl]: true }));
    }
  };

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

  const animationClass = useMemo(() => {
    switch (animationType) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-subtle-bounce';
      case 'glow':
        return 'animate-glow';
      default:
        return '';
    }
  }, [animationType]);

  const is1x1 = gridSize === '1x1';
  const is2x2 = gridSize === '2x2';

  return (
    <a
      href={finalHref}
      target='_blank'
      rel='noopener noreferrer'
      className={cn(
        className,
        animationClass,
        'block isolate overflow-hidden transition-all',
        is1x1 && 'h-full min-h-27.5 flex items-center justify-center p-3',
        is2x2 && 'h-full min-h-55 flex items-center justify-center p-5',
      )}
      style={style}
    >
      {is1x1 ? (
        <div className='flex flex-col items-center justify-center gap-2 w-full h-full text-center'>
          {currentImgUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentImgUrl}
              alt=''
              className='w-7 h-7 object-cover rounded-md shrink-0'
              onError={handleImageError}
            />
          ) : (
            getSocialIcon(url, 'w-6 h-6 shrink-0')
          )}
          <span className='text-[11px] font-semibold leading-tight line-clamp-2'>
            {title}
          </span>
        </div>
      ) : is2x2 ? (
        <div className='flex flex-col items-center justify-center gap-3 w-full h-full text-center'>
          {currentImgUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentImgUrl}
              alt=''
              className='w-12 h-12 object-cover rounded-xl shadow-xs shrink-0'
              onError={handleImageError}
            />
          ) : (
            getSocialIcon(url, 'w-10 h-10 shrink-0')
          )}
          <div className='space-y-1'>
            <span className='text-sm font-bold block leading-snug line-clamp-2'>
              {title}
            </span>
            {subtitle && (
              <span className='text-xs opacity-75 block line-clamp-1'>
                {subtitle}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn('flex items-center justify-center gap-3 w-full h-full')}
        >
          {currentImgUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentImgUrl}
              alt=''
              className='w-5 h-5 object-cover rounded shrink-0'
              onError={handleImageError}
            />
          ) : (
            getSocialIcon(url, 'w-5 h-5 shrink-0')
          )}
          <div className='flex flex-col items-center justify-center overflow-hidden'>
            <span className='truncate text-center'>{title}</span>
            {subtitle && (
              <span className='text-xs opacity-70 truncate text-center mt-0.5 leading-none flex items-center justify-center gap-1'>
                {subtitle}
              </span>
            )}
          </div>
        </div>
      )}
    </a>
  );
}
