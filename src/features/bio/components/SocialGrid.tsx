'use client';

import { getSocialIcon, detectSocialPlatform } from '@/components/ui/social-icons';
import { cn } from '@/lib/utils';
import type { ThemeConfig } from '@/lib/theme/theme.types';

interface SocialGridProps {
  socialLinks: Record<string, string>;
  theme: ThemeConfig;
  className?: string;
  isLoading?: boolean;
}

const SOCIAL_PLATFORM_ORDER: readonly string[] = [
  'instagram',
  'tiktok',
  'twitter',
  'x',
  'x.com',
  'youtube',
  'linkedin',
  'whatsapp',
  'facebook',
  'github',
  'spotify',
  'twitch',
  'discord',
  'telegram',
  'snapchat',
  'pinterest',
  'medium',
  'reddit',
  'behance',
  'dribbble',
];

function getPlatformOrder(key: string, url: string): number {
  const normalizedKey = key.toLowerCase();
  const directIndex = SOCIAL_PLATFORM_ORDER.indexOf(normalizedKey);
  if (directIndex !== -1) {
    return directIndex;
  }

  const detected = detectSocialPlatform(url);
  if (detected) {
    const detectedName = detected.name.toLowerCase();
    const detectedIndex = SOCIAL_PLATFORM_ORDER.indexOf(detectedName);
    if (detectedIndex !== -1) {
      return detectedIndex;
    }
  }

  return 999;
}

export default function SocialGrid({
  socialLinks,
  theme,
  className,
  isLoading,
}: SocialGridProps) {
  const { colors } = theme;

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-3 w-full',
          className,
        )}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'w-8 h-8 rounded-full border shadow-sm backdrop-blur-sm animate-pulse',
              colors.elementBg,
              colors.elementBorder,
            )}
          />
        ))}
      </div>
    );
  }

  const links = Object.entries(socialLinks)
    .filter(([, url]) => Boolean(url))
    .sort(([keyA, urlA], [keyB, urlB]) => {
      const orderA = getPlatformOrder(keyA, urlA);
      const orderB = getPlatformOrder(keyB, urlB);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return keyA.localeCompare(keyB);
    });

  if (links.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-3 w-full',
        className,
      )}
    >
      {links.map(([key, url]) => {
        const platform = detectSocialPlatform(url);
        return (
          <a
            key={key}
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 border shadow-sm backdrop-blur-sm',
              colors.elementBg,
              colors.elementBorder,
              colors.textPrimary,
            )}
            title={platform?.name || 'Social Link'}
          >
            {getSocialIcon(url, 'w-4 h-4')}
          </a>
        );
      })}
    </div>
  );
}
