import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import Link from 'next/link';
import {
  LuLink2,
  LuListTodo,
  LuCar,
  LuSearch,
  LuArrowRight,
} from 'react-icons/lu';

// UKIT Apps configuration
const UKIT_APPS = [
  {
    id: 'bio',
    name: 'Bio',
    description: 'Your public link-in-bio page',
    href: '/app/bio',
    icon: LuLink2,
    status: 'active' as const,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'list',
    name: 'List',
    description: 'Todo, wishlist, and ideas',
    href: '/app/list',
    icon: LuListTodo,
    status: 'coming_soon' as const,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'track',
    name: 'Track',
    description: 'Motor & service tracking',
    href: '/app/track',
    icon: LuCar,
    status: 'coming_soon' as const,
    color: 'bg-green-500/10 text-green-600',
  },
  {
    id: 'id',
    name: 'ID',
    description: 'Caller & number lookup',
    href: '/app/id',
    icon: LuSearch,
    status: 'coming_soon' as const,
    color: 'bg-orange-500/10 text-orange-600',
  },
];

/**
 * Platform Home - App Switcher
 * Shows all available UKIT apps
 */
export default async function AppHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const publicUrl = `/${profile.username}`;

  const userData = {
    username: profile.username,
    email: user.email,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
  };

  return (
    <div className='min-h-screen relative flex flex-col'>
      <BackgroundBlobs />

      <Header variant='dashboard' user={userData} publicUrl={publicUrl} />

      <main className='relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1 w-full'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Welcome back, {profile.display_name || profile.username}!
          </h1>
          <p className='text-muted-foreground mt-1'>
            Choose an app to get started
          </p>
        </div>

        {/* App Grid */}
        <div className='grid sm:grid-cols-2 gap-4'>
          {UKIT_APPS.map((app) => {
            const Icon = app.icon;
            const isActive = app.status === 'active';

            return (
              <Link
                key={app.id}
                href={isActive ? app.href : '#'}
                className={`
                  group relative p-6 rounded-2xl border bg-card
                  transition-all duration-200
                  ${
                    isActive
                      ? 'hover:border-primary/40 hover:shadow-lg cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }
                `}
              >
                <div className='flex items-start gap-4'>
                  <div className={`p-3 rounded-xl ${app.color}`}>
                    <Icon className='w-6 h-6' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <h2 className='font-semibold text-lg'>{app.name}</h2>
                      {!isActive && (
                        <span className='text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded'>
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {app.description}
                    </p>
                  </div>
                  {isActive && (
                    <LuArrowRight className='w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
