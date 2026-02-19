'use client';

import { getSocialIcon, detectSocialPlatform } from '@/lib/social-icons';
import { cn } from '@/lib/utils';
import type { ThemeConfig } from '@/lib/theme/theme.types';

interface SocialGridProps {
  socialLinks: Record<string, string>;
  theme: ThemeConfig;
  className?: string;
}

export default function SocialGrid({
  socialLinks,
  theme,
  className,
}: SocialGridProps) {
  const links = Object.entries(socialLinks).filter(([, url]) => !!url);

  if (links.length === 0) return null;

  const { colors } = theme;

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
