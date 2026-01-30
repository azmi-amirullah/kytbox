import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import { LinkButton } from './components/LinkButton';
import { trackProfileView } from '@/lib/tracking';
import { cn } from '@/lib/utils';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get profile (fetch fresh, no cache)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  // Fire and forget tracking
  // We pass profile.id. Since trackProfileView uses after(), it won't block rendering.
  trackProfileView(profile.id);

  // Get active links
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const theme = profile.theme_name || 'default';
  const buttonStyle = profile.button_style || 'default';
  const buttonShape = profile.button_shape || 'rounded';

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

  const shapeClass = buttonShape === 'square' ? 'rounded-none' : 'rounded-xl';

  return (
    <div
      className={cn(
        'min-h-screen w-full selection:bg-primary/10 selection:text-primary',
        selectedThemeClass,
      )}
    >
      <div className='w-full max-w-[680px] mx-auto px-6 py-16 md:py-24 flex flex-col items-center'>
        {/* Profile Header */}
        <div className='text-center mb-12 w-full animate-in fade-in slide-in-from-bottom-3 duration-700'>
          <div className='relative inline-block mb-6'>
            {profile.avatar_url ? (
              <div className='relative w-28 h-28 md:w-32 md:h-32'>
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  fill
                  className='rounded-full object-cover ring-2 ring-border/50 shadow-sm'
                  priority
                />
              </div>
            ) : (
              <div className='w-28 h-28 md:w-32 md:h-32 rounded-full bg-secondary/20 flex items-center justify-center text-foreground text-4xl font-semibold ring-2 ring-border/50 shadow-sm backdrop-blur-sm'>
                {(profile.display_name || profile.username)
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>

          <h1 className='text-3xl font-bold text-foreground tracking-tight mb-3'>
            {profile.display_name || profile.username}
          </h1>
          {profile.bio && (
            <p className='text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed text-balance'>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className='w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both'>
          {links && links.length > 0 ? (
            links.map((link) => {
              const buttonClasses =
                theme === 'default'
                  ? cn(
                      'group block w-full p-4 md:p-5 text-center text-lg font-medium transition-all duration-200 ease-in-out hover:-translate-y-0.5',
                      'bg-card border border-border text-card-foreground shadow-xs hover:shadow-md hover:border-primary/20 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50',
                      shapeClass,
                    )
                  : cn(
                      'group block w-full p-4 md:p-5 text-center text-lg font-medium transition-all duration-200 ease-in-out hover:-translate-y-0.5',
                      'border backdrop-blur-sm shadow-none',
                      shapeClass,
                      buttonStyle === 'outline'
                        ? isDarkTheme
                          ? 'border-white/30 text-white hover:bg-white/10'
                          : 'border-black/20 text-neutral-900 hover:bg-black/5'
                        : isDarkTheme
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                          : 'bg-black/5 border-black/10 text-neutral-900 hover:bg-black/10 hover:border-black/20',
                    );

              return (
                <LinkButton
                  key={link.id}
                  href={`/${username}/${link.short_id ?? link.id}`}
                  title={link.title}
                  url={link.url}
                  className={buttonClasses}
                />
              );
            })
          ) : (
            <div className='text-center p-8 rounded-xl bg-secondary/10 border border-border/20 border-dashed backdrop-blur-sm'>
              <p className='text-muted-foreground'>No links added yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='mt-20 text-center animate-in fade-in slide-in-from-bottom-5 duration-1000'>
          <Link
            href='/'
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all shadow-sm hover:scale-105 active:scale-95',
              theme === 'default'
                ? 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:bg-neutral-200'
                : isDarkTheme
                  ? 'bg-white/10 border-white/20 text-white/70 backdrop-blur-md hover:bg-white/20'
                  : 'bg-black/5 border-black/10 text-neutral-900/40 backdrop-blur-md hover:bg-black/10',
            )}
          >
            <span className='text-xs font-bold tracking-wider'>Powered by</span>
            <span
              className={cn(
                'text-xs font-black tracking-wider',
                theme === 'default'
                  ? 'text-neutral-900'
                  : isDarkTheme
                    ? 'text-white'
                    : 'text-neutral-900',
              )}
            >
              UKIT
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
