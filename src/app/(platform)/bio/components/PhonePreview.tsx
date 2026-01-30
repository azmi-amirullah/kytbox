'use client';

import Image from 'next/image';
import { LuUser } from 'react-icons/lu';
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
            {/* Header Preview */}
            <div className='relative w-16 h-16 rounded-full mb-3 flex items-center justify-center ring-2 ring-border/50 overflow-hidden bg-secondary/30 shadow-inner'>
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt='Avatar'
                  fill
                  className='object-cover'
                />
              ) : (
                <LuUser className='w-8 h-8 opacity-40' />
              )}
            </div>

            <h2 className='text-sm font-bold truncate max-w-full px-2'>
              {profile.display_name || profile.username || 'Your Name'}
            </h2>

            {profile.bio && (
              <p className='text-[10px] opacity-70 mt-1 line-clamp-2 px-4 text-center leading-relaxed'>
                {profile.bio}
              </p>
            )}

            {/* Links Preview */}
            <div className='w-full space-y-3 flex-1 mt-10'>
              {activeLinks.length > 0 ? (
                activeLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`
                      block w-full p-3 text-center transition-all duration-300 text-[11px] font-medium border
                      ${theme === 'default' ? `text-card-foreground ${selectedButtonClass}` : ''}
                      ${theme !== 'default' && buttonStyle === 'default' ? (isDarkTheme ? `${shapeClasses[buttonShape]} bg-white/15 border-white/25 text-white shadow-lg shadow-black/20` : `${shapeClasses[buttonShape]} bg-black/5 border-black/10 text-neutral-900 shadow-sm`) : ''}
                      ${theme !== 'default' && buttonStyle === 'outline' ? (isDarkTheme ? `${shapeClasses[buttonShape]} bg-transparent border-2 border-white/40 text-white shadow-none` : `${shapeClasses[buttonShape]} bg-transparent border-2 border-black/20 text-neutral-900 shadow-none`) : ''}
                    `}
                  >
                    <div className='flex items-center justify-center gap-2'>
                      {getSocialIcon(link.url, 'w-3.5 h-3.5 shrink-0')}
                      <span className='truncate'>{link.title}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-center text-[10px] text-muted-foreground opacity-50 italic'>
                  Add links in the dashboard...
                </p>
              )}
            </div>

            {/* Preview Footer */}
            <div className='mt-auto pt-8 pb-4 flex flex-col items-center'>
              <div
                className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all shadow-sm
                ${
                  theme === 'default'
                    ? 'bg-neutral-100 border-neutral-200 text-neutral-500'
                    : isDarkTheme
                      ? 'bg-white/10 border-white/20 text-white/70 backdrop-blur-md'
                      : 'bg-black/5 border-black/10 text-neutral-900/40 backdrop-blur-md'
                }
              `}
              >
                <span className='text-[10px] font-bold tracking-wider'>
                  Powered by
                </span>
                <span
                  className={`text-[10px] font-black tracking-wider ${theme === 'default' ? 'text-neutral-900' : isDarkTheme ? 'text-white' : 'text-neutral-900'}`}
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
