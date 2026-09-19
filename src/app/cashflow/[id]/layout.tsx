import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BackgroundBlobs } from '@/components/background-blobs'
import { PlatformOverlays } from '@/components/platform-overlays'
import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/config/site'

export default async function CashflowDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, display_name, role')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  }

  const publicUrl = profile ? `${siteConfig.url}/${profile.username}` : undefined

  const userData =
    user && profile
      ? {
          id: user.id,
          username: profile.username,
          email: user.email,
          avatar_url: profile.avatar_url,
          display_name: profile.display_name,
          role: profile.role,
        }
      : undefined

  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />
      <Header variant='dashboard' user={userData} publicUrl={publicUrl} />
      <main className='relative z-10 max-w-7xl mx-auto px-4 mt-16 py-8 flex-1 w-full'>
        {children}
      </main>
      <Footer />
      <PlatformOverlays hasCompletedOnboarding={true} />
    </div>
  )
}
