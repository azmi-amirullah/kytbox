'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

import { getSocialIcon } from '@/lib/social-icons';

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
  // Filter only active links for the preview, just like real page
  const activeLinks = links.filter((l) => l.is_active);

  const theme = profile?.theme_name || 'default';
  const buttonShape = profile?.button_shape || 'rounded';
  const buttonStyle = profile?.button_style || 'default';

  const themeClasses: Record<string, string> = {
    default: 'light forced-light bg-white text-neutral-900',
    dark: 'dark forced-dark bg-neutral-950 text-white',
    gradient:
      'dark forced-dark bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-950 text-white',
    peach:
      'dark forced-dark bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 text-white',
    deepsea:
      'dark forced-dark bg-gradient-to-br from-teal-500 via-blue-700 to-slate-900 text-white',
    emerald:
      'dark forced-dark bg-gradient-to-br from-emerald-500 via-green-700 to-teal-900 text-white',
    lavender:
      'light forced-light bg-gradient-to-br from-violet-200 via-purple-300 to-fuchsia-400 text-neutral-900',
    latte:
      'light forced-light bg-gradient-to-br from-orange-50 via-amber-50 to-stone-200 text-neutral-900',
    cyber:
      'dark forced-dark bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 text-white',
  };

  const isDarkTheme =
    theme !== 'default' && theme !== 'lavender' && theme !== 'latte';

  const selectedThemeClass = themeClasses[theme] || themeClasses.default;

  const shapeClasses: Record<string, string> = {
    rounded: 'rounded-xl',
    square: 'rounded-none',
  };

  const styleClasses: Record<string, string> = {
    default: 'bg-card border-border shadow-sm',
    outline: 'bg-transparent border-2 border-current/20 shadow-none',
  };

  const selectedButtonClass = `${shapeClasses[buttonShape] || shapeClasses.rounded} ${styleClasses[buttonStyle] || styleClasses.default}`;

  return (
    <div className='relative w-full max-w-[320px] mx-auto group'>
      {/* Phone Frame */}
      <div className='relative aspect-9/19 w-full bg-neutral-900 rounded-[3rem] p-3 shadow-2xl ring-1 ring-white/10'>
        {/* Inner Screen */}
        <div
          className={`relative w-full h-full rounded-[2.5rem] overflow-hidden overflow-y-auto scrollbar-hide transition-colors duration-500 ${selectedThemeClass}`}
        >
          <div className='px-4 pt-14 pb-8 flex flex-col items-center min-h-full'>
            {/* Content Section */}
            <div className='flex-1 w-full flex flex-col items-center'>
              {/* Header Preview */}
              <div
                className={cn(
                  'relative w-16 h-16 rounded-full mb-3 flex items-center justify-center ring-2 overflow-hidden shadow-sm backdrop-blur-sm',
                  theme === 'default' ||
                    theme === 'lavender' ||
                    theme === 'latte'
                    ? 'bg-black/5 ring-black/5'
                    : 'bg-white/10 ring-white/20',
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
                  <span
                    className={cn(
                      'text-xl font-bold',
                      theme === 'default' ||
                        theme === 'lavender' ||
                        theme === 'latte'
                        ? 'text-neutral-900'
                        : 'text-white',
                    )}
                  >
                    {(profile.display_name || profile.username || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <h2
                className={cn(
                  'text-base font-bold tracking-tight mb-1 truncate max-w-full px-2 text-center',
                  theme === 'default' ||
                    theme === 'lavender' ||
                    theme === 'latte'
                    ? 'text-neutral-900'
                    : 'text-white',
                )}
              >
                {profile.display_name || profile.username || 'Your Name'}
              </h2>

              {profile.bio && (
                <p
                  className={cn(
                    'text-[10px] line-clamp-2 px-4 text-center leading-relaxed opacity-80',
                    theme === 'default' ||
                      theme === 'lavender' ||
                      theme === 'latte'
                      ? 'text-neutral-600'
                      : 'text-white/80',
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
                        theme === 'default' &&
                          `bg-card border-border text-card-foreground shadow-xs ${selectedButtonClass}`,
                        theme !== 'default' &&
                          buttonStyle === 'default' &&
                          (isDarkTheme
                            ? `${shapeClasses[buttonShape]} bg-white/10 border-white/20 text-white`
                            : `${shapeClasses[buttonShape]} bg-black/5 border-black/10 text-neutral-900`),
                        theme !== 'default' &&
                          buttonStyle === 'outline' &&
                          (isDarkTheme
                            ? `${shapeClasses[buttonShape]} bg-transparent border-white/30 text-white`
                            : `${shapeClasses[buttonShape]} bg-transparent border-black/20 text-neutral-900`),
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
                      theme === 'default' ||
                        theme === 'lavender' ||
                        theme === 'latte'
                        ? 'bg-black/5 border-black/10'
                        : 'bg-white/10 border-white/20',
                    )}
                  >
                    <p
                      className={cn(
                        'text-[10px]',
                        theme === 'default' ||
                          theme === 'lavender' ||
                          theme === 'latte'
                          ? 'text-neutral-500'
                          : 'text-white/60',
                      )}
                    >
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
                  theme === 'default' ||
                    theme === 'lavender' ||
                    theme === 'latte'
                    ? 'bg-neutral-100 border-neutral-200 text-neutral-500'
                    : 'bg-white/10 border-white/20 text-white/70 backdrop-blur-md',
                )}
              >
                <span className='text-[10px] font-bold tracking-wider'>
                  Powered by
                </span>
                <span
                  className={cn(
                    'text-[10px] font-black tracking-wider',
                    theme === 'default' ||
                      theme === 'lavender' ||
                      theme === 'latte'
                      ? 'text-neutral-900'
                      : 'text-white',
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
