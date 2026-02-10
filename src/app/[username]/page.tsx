import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import { LinkButton } from './components/LinkButton';
import { trackProfileView } from '@/lib/tracking';
import { cn } from '@/lib/utils';
import {
  getTheme,
  getContainerClasses,
  getButtonClasses,
  validateButtonStyle,
  validateButtonShape,
} from '@/lib/theme';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get profile first (required for links query)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  // Fire and forget tracking
  trackProfileView(profile.id);

  // Get links for this specific user (filtered at DB level)
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const theme = getTheme(profile.theme_name);
  const buttonStyle = validateButtonStyle(profile.button_style);
  const buttonShape = validateButtonShape(profile.button_shape);

  const { colors } = theme;
  const buttonClasses = getButtonClasses(theme, buttonStyle, buttonShape, {
    variant: 'full',
  });

  return (
    <div
      className={cn(
        'min-h-screen w-full selection:bg-primary/10 selection:text-primary',
        getContainerClasses(theme),
      )}
    >
      <div className='w-full max-w-[680px] mx-auto px-6 flex flex-col min-h-screen'>
        {/* Content Section */}
        <div className='flex-1 w-full pt-16 md:pt-24 pb-12 flex flex-col items-center'>
          {/* Profile Header */}
          <div className='text-center mb-12 w-full animate-in fade-in zoom-in-95 duration-700 fill-mode-both'>
            <div className='relative inline-block mb-6'>
              {profile.avatar_url ? (
                <div className='relative w-28 h-28 md:w-32 md:h-32'>
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.username}
                    fill
                    className={cn(
                      'rounded-full object-cover shadow-sm ring-2',
                      colors.elementRing,
                    )}
                    priority
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    'w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-4xl font-semibold shadow-sm backdrop-blur-sm ring-2',
                    colors.elementBg,
                    colors.textPrimary,
                    colors.elementRing,
                  )}
                >
                  {(profile.display_name || profile.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <h1
              className={cn(
                'text-3xl font-bold tracking-tight mb-3',
                colors.textPrimary,
              )}
            >
              {profile.display_name || profile.username}
            </h1>
            {profile.bio && (
              <p
                className={cn(
                  'text-lg max-w-lg mx-auto leading-relaxed text-balance',
                  colors.textSecondary,
                )}
              >
                {profile.bio}
              </p>
            )}
          </div>

          {/* Links */}
          <div className='w-full space-y-4'>
            {links && links.length > 0 ? (
              links.map((link, index) => (
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
                  'text-center p-8 rounded-xl border border-dashed backdrop-blur-sm',
                  colors.elementBg,
                  colors.elementBorder,
                )}
              >
                <p className={colors.textSecondary}>No links added yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='mt-auto py-10 text-center'>
          <Link
            href='/'
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all shadow-sm hover:scale-105 active:scale-95',
              colors.footerBg,
              colors.footerBorder,
              colors.footerText,
            )}
          >
            <span className='text-xs font-bold tracking-wider'>Powered by</span>
            <span
              className={cn(
                'text-xs font-black tracking-wider',
                colors.footerBrandText,
              )}
            >
              Kytbox
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  return {
    title: profile?.display_name || `@${username}`,
    description: profile?.bio || `Check out ${username}'s links`,
  };
}
