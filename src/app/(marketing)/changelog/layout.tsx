import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getOptionalUserAndProfile } from '@/lib/auth'

export default async function ChangelogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getOptionalUserAndProfile()

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
      : null

  return (
    <div className='min-h-screen flex flex-col bg-background relative overflow-hidden'>
      {/* Background Glows */}
      <div className='absolute inset-0 z-0 opacity-40 pointer-events-none'>
        <div className='absolute top-[-10%] right-[-5%] w-125 h-125 rounded-full bg-primary/10 blur-[120px]' />
        <div className='absolute top-[30%] left-[-10%] w-125 h-125 rounded-full bg-blue-500/10 blur-[120px]' />
      </div>

      {/* Header */}
      <Header variant='legal' user={userData} />

      {/* Content */}
      <main className='flex-1 relative z-10 container mx-auto px-4 py-10 md:py-16 mt-16'>
        <div className='max-w-4xl mx-auto'>{children}</div>
      </main>

      <Footer variant='landing' />
    </div>
  )
}
