'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LinkButton } from './LinkButton';
import type { ThemeConfig } from '@/lib/theme/theme.types';

interface ProfileLinksProps {
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
    short_id?: string | number | null;
  }[];
  username: string;
  theme: ThemeConfig;
  buttonClasses: string;
  isLoading?: boolean;
}

export default function ProfileLinks({
  links,
  username,
  theme,
  buttonClasses,
  isLoading,
}: ProfileLinksProps) {
  const { colors } = theme;
  const activeLinks = links.filter((l) => l.is_active);

  return (
    <div className='w-full space-y-4'>
      {isLoading ? (
        [1, 2, 3].map((i) => (
          <Skeleton key={i} className='w-full rounded-lg h-[60px]' />
        ))
      ) : activeLinks.length > 0 ? (
        activeLinks.map((link, index) => (
          <LinkButton
            key={link.id}
            href={`/${username}/${link.short_id ?? link.id}`}
            title={link.title}
            url={link.url}
            className={cn(
              buttonClasses,
              'animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both',
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))
      ) : (
        <div
          className={cn(
            'text-center rounded-xl border border-dashed backdrop-blur-sm p-8',
            colors.elementBg,
            colors.elementBorder,
          )}
        >
          <p className={cn(colors.textSecondary, 'text-base')}>
            No links added yet
          </p>
        </div>
      )}
    </div>
  );
}
