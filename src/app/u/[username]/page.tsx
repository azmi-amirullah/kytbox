import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';

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

  // Get active links
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <div className='min-h-screen bg-background flex flex-col items-center px-4 py-12'>
      {/* Profile Header */}
      <div className='text-center mb-8'>
        {profile.avatar_url ? (
          <div className='relative w-24 h-24 mx-auto mb-4'>
            <Image
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              fill
              className='rounded-full object-cover border-2 border-border'
            />
          </div>
        ) : (
          <div className='w-24 h-24 rounded-full mx-auto mb-4 bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-2 border-border'>
            {(profile.display_name || profile.username).charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className='text-2xl font-bold text-foreground'>
          {profile.display_name || profile.username}
        </h1>
        {profile.bio && (
          <p className='text-muted-foreground mt-2 max-w-md'>{profile.bio}</p>
        )}
      </div>

      {/* Links */}
      <div className='w-full max-w-md space-y-4'>
        {links && links.length > 0 ? (
          links.map((link) => (
            <a
              key={link.id}
              href={`/u/${username}/${link.id}`}
              className='
                block w-full p-4 rounded-lg text-center
                bg-card border border-border
                text-card-foreground font-medium
                hover:bg-accent hover:text-accent-foreground
                hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-200
                shadow-sm
              '
            >
              {link.title}
            </a>
          ))
        ) : (
          <p className='text-center text-muted-foreground'>No links yet</p>
        )}
      </div>

      {/* Footer */}
      <div className='mt-12 text-center text-muted-foreground text-sm'>
        <p>Powered by Link-Base</p>
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
