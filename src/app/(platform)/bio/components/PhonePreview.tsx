import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getSocialIcon } from '@/lib/social-icons';
import SocialGrid from './SocialGrid';
import {
  getTheme,
  getContainerClasses,
  getButtonClasses,
  validateButtonStyle,
  validateButtonShape,
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
    social_links?: Record<string, string> | null;
  };
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
  }[];
  isLoading?: boolean;
}

export default function PhonePreview({
  profile,
  links,
  isLoading,
}: PhonePreviewProps) {
  const activeLinks = links.filter((l) => l.is_active);

  const theme = getTheme(profile?.theme_name);
  const buttonShape = validateButtonShape(profile?.button_shape);
  const buttonStyle = validateButtonStyle(profile?.button_style);

  const { colors } = theme;
  const buttonClasses = getButtonClasses(theme, buttonStyle, buttonShape);

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
                {isLoading ? (
                  <Skeleton className='w-full h-full' />
                ) : profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt='Avatar'
                    fill
                    className='object-cover'
                    priority
                  />
                ) : (
                  <span className={cn('text-xl font-bold', colors.textPrimary)}>
                    {(profile.display_name || profile.username || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className='flex flex-col items-center space-y-2 w-full'>
                  <Skeleton className='h-5 w-32 rounded-md' />
                  <Skeleton className='h-3 w-48 rounded-md mb-10' />
                </div>
              ) : (
                <>
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
                        'text-[10px] line-clamp-2 px-4 text-center leading-relaxed opacity-80 mb-4',
                        colors.textSecondary,
                      )}
                    >
                      {profile.bio}
                    </p>
                  )}

                  {/* Social Grid */}
                  <SocialGrid
                    socialLinks={profile.social_links || {}}
                    theme={theme}
                    className='mb-4'
                  />
                </>
              )}

              {/* Links Preview */}
              <div className='w-full space-y-3 mt-10 px-4'>
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <Skeleton key={i} className='h-10 w-full rounded-lg' />
                  ))
                ) : activeLinks.length > 0 ? (
                  activeLinks.map((link) => (
                    <div
                      key={link.id}
                      className={cn(
                        'block w-full p-2.5 text-center transition-all duration-300 text-[11px] font-medium border',
                        buttonClasses,
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
                      colors.textSecondary,
                    )}
                  >
                    <p className='text-[10px]'>No links added yet</p>
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
                  Kytbox
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
