import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getPublicListBySlug } from '@/features/list/actions'
import { PublicWishlistBoard } from '@/features/list/components/PublicWishlistBoard'
import { PublicKanbanBoard } from '@/features/list/components/PublicKanbanBoard'
import { FiArrowLeft, FiGift, FiCheckSquare, FiAward } from 'react-icons/fi'

interface PublicListPageProps {
  params: Promise<{ username: string; slug: string }>
}

export async function generateMetadata({
  params,
}: PublicListPageProps): Promise<Metadata> {
  const { username, slug } = await params
  const res = await getPublicListBySlug(username, slug)

  if (!res.list || !res.profile) {
    return { title: 'List Not Found | Kytbox' }
  }

  const name = res.profile.full_name || res.profile.username
  return {
    title: `${res.list.title} — ${name}'s ${res.list.type === 'wishlist' ? 'Wishlist' : 'List'} | Kytbox`,
    description: res.list.description || `Explore ${res.list.title} by @${res.profile.username} on Kytbox.`,
  }
}

export default async function PublicListPage({ params }: PublicListPageProps) {
  const { username, slug } = await params
  const res = await getPublicListBySlug(username, slug)

  if (!res.list || !res.profile) {
    notFound()
  }

  const { list, profile, columns, items } = res
  const displayName = profile.full_name || profile.username
  const isWishlist = list.type === 'wishlist'

  // Read guest claim cookie
  const cookieStore = await cookies()
  const rawClaims = cookieStore.get('kytbox_guest_claims')?.value
  let guestClaims: { itemId: string; claimToken: string }[] = []
  if (rawClaims) {
    try {
      const parsed = JSON.parse(rawClaims)
      if (Array.isArray(parsed)) {
        guestClaims = parsed
      }
    } catch {
      guestClaims = []
    }
  }

  // Check if current session is list creator
  let isOwner = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isOwner = Boolean(user && (user.id === profile.id || user.id === list.user_id))
  } catch {
    isOwner = false
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${profile.username}/list`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to {displayName}&apos;s lists
          </Link>

          <Link
            href={`/${profile.username}`}
            className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
          >
            @{profile.username}
          </Link>
        </div>

        {/* List Header */}
        <header className="p-6 sm:p-8 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`p-2.5 rounded-xl ${
                  isWishlist
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}
              >
                {isWishlist ? (
                  <FiGift className="w-6 h-6" />
                ) : list.type === 'todo' ? (
                  <FiCheckSquare className="w-6 h-6" />
                ) : (
                  <FiAward className="w-6 h-6" />
                )}
              </span>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {list.title}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Curated by{' '}
                  <Link
                    href={`/${profile.username}`}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {displayName}
                  </Link>
                </p>
              </div>
            </div>

            {/* Profile Avatar Chip */}
            <div className="flex items-center gap-2">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover border border-border shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              {isOwner && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Owner Admin
                </span>
              )}
            </div>
          </div>

          {list.description && (
            <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
              {list.description}
            </p>
          )}
        </header>

        {/* Board / Wishlist Content */}
        {isWishlist ? (
          <PublicWishlistBoard
            list={list}
            items={items}
            guestClaims={guestClaims}
            isOwner={isOwner}
            creatorName={displayName}
          />
        ) : (
          <PublicKanbanBoard columns={columns} items={items} />
        )}

        {/* Footer brand */}
        <div className="text-center pt-8 text-xs text-muted-foreground">
          Powered by{' '}
          <Link href="/" className="font-bold hover:text-foreground">
            Kytbox
          </Link>
        </div>
      </div>
    </main>
  )
}
