import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BackgroundBlobs } from '@/components/background-blobs'
import { PlatformOverlays } from '@/components/platform-overlays'
import { getGoalDetailData, GoalDetail } from '@/features/cashflow'
import { connection } from 'next/server'
import { z } from 'zod'

const goalIdSchema = z.uuid()

interface GoalDetailPageProps {
  params: Promise<{ goalId: string }>
}

export async function generateMetadata({ params }: GoalDetailPageProps): Promise<Metadata> {
  const { goalId } = await params
  if (!goalIdSchema.safeParse(goalId).success) {
    return {
      title: 'Savings Goal',
      robots: { index: false, follow: false },
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cashflow_goals')
    .select('title')
    .eq('id', goalId)
    .maybeSingle()
  if (error) {
    console.error('cashflow_goal_metadata_lookup_failed', error)
  }
  const title = data?.title ?? 'Savings Goal'
  return {
    title,
    description: 'Savings goal tracker — ' + title,
    robots: { index: false, follow: false },
  }
}

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { goalId } = await params
  if (!goalIdSchema.safeParse(goalId).success) notFound()

  await connection()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let data
  try {
    data = await getGoalDetailData(supabase, goalId, user.id, user.email)
  } catch (error) {
    if (error instanceof Error && error.message === 'GOAL_NOT_FOUND') notFound()
    throw error
  }

  const { goal, entries, currency } = data

  const profileResult = await supabase
    .from('profiles')
    .select('username, avatar_url, display_name, role')
    .eq('id', user.id)
    .single()

  if (profileResult.error) {
    console.error('cashflow_goal_profile_lookup_failed', profileResult.error)
    throw new Error('GOAL_PROFILE_LOOKUP_FAILED')
  }

  const profile = profileResult.data

  const userData =
    user && profile
      ? {
          username: profile.username,
          email: user.email,
          avatar_url: profile.avatar_url,
          display_name: profile.display_name,
          role: profile.role,
        }
      : undefined

  const publicUrl = profile ? '/' + profile.username : undefined

  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />
      <Header variant='dashboard' user={userData} publicUrl={publicUrl} />
      <main className='relative z-10 max-w-7xl mx-auto px-4 mt-16 py-8 flex-1 w-full'>
        <GoalDetail goal={goal} entries={entries} currency={currency} />
      </main>
      <Footer />
      <PlatformOverlays hasCompletedOnboarding={true} />
    </div>
  )
}
