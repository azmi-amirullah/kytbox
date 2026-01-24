import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import { LinkButton } from './components/LinkButton';
import { trackProfileView } from '@/lib/tracking';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
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

  return (
    <div className='min-h-screen bg-background w-full selection:bg-primary/10 selection:text-primary'>
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
                  className='rounded-full object-cover ring-2 ring-border shadow-sm'
                  priority
                />
              </div>
            ) : (
              <div className='w-28 h-28 md:w-32 md:h-32 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-4xl font-semibold ring-2 ring-border shadow-sm'>
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
            links.map((link) => (
              <LinkButton
                key={link.id}
                href={`/${username}/${link.short_id ?? link.id}`}
                title={link.title}
                className='
                  group block w-full p-4 md:p-5 rounded-xl
                  bg-card border border-border
                  text-card-foreground font-medium text-center text-lg
                  shadow-xs hover:shadow-md
                  hover:border-primary/20 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50
                  transition-all duration-200 ease-in-out
                  hover:-translate-y-0.5
                '
              />
            ))
          ) : (
            <div className='text-center p-8 rounded-xl bg-secondary/30 border border-border/50 border-dashed'>
              <p className='text-muted-foreground'>No links added yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='mt-20 text-center opacity-40 hover:opacity-100 transition-opacity duration-300'>
          <Link
            href='/'
            className='inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors'
          >
            <span>Powered by</span>
            <span className='font-bold text-foreground'>Link-Base</span>
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
    .select('display_name, bio')
    .eq('username', username)
    .single();

  return {
    title: profile?.display_name || `@${username}`,
    description: profile?.bio || `Check out ${username}'s links`,
  };
}
