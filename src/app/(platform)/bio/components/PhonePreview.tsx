'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getSocialIcon } from '@/lib/social-icons';
import {
  getTheme,
  getContainerClasses,
  getShapeClass,
  type ButtonStyle,
  type ButtonShape,
} from '@/lib/theme';

interface PhonePreviewProps {
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    theme_name?: string | null;
    button_style?: string | null;
    button_shape?: string | null;
  };
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
  }[];
}

export default function PhonePreview({ profile, links }: PhonePreviewProps) {
  const activeLinks = links.filter((l) => l.is_active);

  const theme = getTheme(profile?.theme_name);
  const buttonShape = (profile?.button_shape || 'rounded') as ButtonShape;
  const buttonStyle = (profile?.button_style || 'default') as ButtonStyle;

  const { colors } = theme;
  const shapeClass = getShapeClass(buttonShape);

  // Build button classes based on style
  const getButtonClasses = () => {
    if (buttonStyle === 'outline') {
      return cn(
        shapeClass,
        'bg-transparent border-2',
        colors.outlineBorder,
        colors.outlineText,
      );
    }
    return cn(
      shapeClass,
      colors.buttonBg,
      'border',
      colors.buttonBorder,
      colors.buttonText,
      'shadow-sm',
    );
  };

  return (
    <div className='relative w-full max-w-[320px] mx-auto group'>
      {/* Phone Frame */}
      <div className='relative aspect-9/19 w-full bg-neutral-900 rounded-[3rem] p-3 shadow-2xl ring-1 ring-white/10'>
        {/* Inner Screen */}
        <div
          className={cn(
            'relative w-full h-full rounded-[2.5rem] overflow-hidden overflow-y-auto scrollbar-hide transition-colors duration-500',
            getContainerClasses(theme),
          )}
        >
          <div className='px-4 pt-14 pb-8 flex flex-col items-center min-h-full'>
            {/* Content Section */}
            <div className='flex-1 w-full flex flex-col items-center'>
              {/* Header Preview */}
              <div
                className={cn(
                  'relative w-16 h-16 rounded-full mb-3 flex items-center justify-center ring-2 overflow-hidden shadow-sm backdrop-blur-sm',
                  colors.elementBg,
                  colors.elementRing,
                )}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt='Avatar'
                    fill
                    className='object-cover'
                  />
                ) : (
                  <span className={cn('text-xl font-bold', colors.textPrimary)}>
                    {(profile.display_name || profile.username || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <h2
                className={cn(
                  'text-base font-bold tracking-tight mb-1 truncate max-w-full px-2 text-center',
                  colors.textPrimary,
                )}
              >
                {profile.display_name || profile.username || 'Your Name'}
              </h2>

              {profile.bio && (
                <p
                  className={cn(
                    'text-[10px] line-clamp-2 px-4 text-center leading-relaxed opacity-80',
                    colors.textSecondary,
                  )}
                >
                  {profile.bio}
                </p>
              )}

              {/* Links Preview */}
              <div className='w-full space-y-3 mt-10 px-4'>
                {activeLinks.length > 0 ? (
                  activeLinks.map((link) => (
                    <div
                      key={link.id}
                      className={cn(
                        'block w-full p-2.5 text-center transition-all duration-300 text-[11px] font-medium border',
                        getButtonClasses(),
                      )}
                    >
                      <div className='flex items-center justify-center gap-2'>
                        {getSocialIcon(link.url, 'w-3 h-3 shrink-0')}
                        <span className='truncate'>{link.title}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className={cn(
                      'text-center p-6 rounded-xl border border-dashed backdrop-blur-sm',
                      colors.elementBg,
                      colors.elementBorder,
                    )}
                  >
                    <p className={cn('text-[10px]', colors.textSecondary)}>
                      No links added yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Footer */}
            <div className='mt-auto pt-8 pb-4 flex flex-col items-center'>
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all shadow-sm',
                  colors.footerBg,
                  colors.footerBorder,
                  colors.footerText,
                )}
              >
                <span className='text-[10px] font-bold tracking-wider'>
                  Powered by
                </span>
                <span
                  className={cn(
                    'text-[10px] font-black tracking-wider',
                    colors.footerBrandText,
                  )}
                >
                  UKIT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notch */}
        <div className='absolute top-6 left-1/2 -translate-x-1/2 w-20 h-5 bg-neutral-900 rounded-full z-10' />
      </div>
    </div>
  );
}
