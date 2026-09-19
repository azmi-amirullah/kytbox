import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPublicListsByUsername } from '@/features/list/actions'
import { FiArrowLeft, FiGift, FiCheckSquare, FiAward } from 'react-icons/fi'

interface PublicListsGalleryProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: PublicListsGalleryProps): Promise<Metadata> {
  const { username } = await params
  const res = await getPublicListsByUsername(username)

  if (!res.profile) {
    return { title: 'Lists | Kytbox' }
  }

  const name = res.profile.full_name || res.profile.username
  return {
    title: `${name}'s Public Lists & Wishlists | Kytbox`,
    description: `Explore public lists, resource collections, and wishlists curated by @${res.profile.username} on Kytbox.`,
  }
}

export default async function PublicListsGalleryPage({
  params,
}: PublicListsGalleryProps) {
  const { username } = await params
  const res = await getPublicListsByUsername(username)

  if (!res.profile) {
    notFound()
  }

  const { profile, lists } = res
  const displayName = profile.full_name || profile.username

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation back to profile */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${profile.username}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to @{profile.username}&apos;s profile
          </Link>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Public Showcase
          </span>
        </div>

        {/* Profile Card Header */}
        <header className="p-6 sm:p-8 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 shadow-inner"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground border border-border">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {displayName}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="text-sm text-foreground/80 leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}
          </div>
        </header>

        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h2 className="text-lg font-bold tracking-tight">
            Published Lists &amp; Wishlists ({lists.length})
          </h2>
        </div>

        {/* Lists Grid */}
        {lists.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
            <FiGift className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
            <p className="font-semibold text-foreground">No public lists published yet</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Check back soon for curated lists, wishlist gift registries, and resource hubs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lists.map((list) => {
              const isWishlist = list.type === 'wishlist'
              const isTodo = list.type === 'todo'
              const href = `/${profile.username}/list/${list.slug || list.id}`

              return (
                <Link
                  key={list.id}
                  href={href}
                  className="group relative p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/50 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
                          isWishlist
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : isTodo
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isWishlist && <FiGift className="w-3.5 h-3.5" />}
                        {isTodo && <FiCheckSquare className="w-3.5 h-3.5" />}
                        {!isWishlist && !isTodo && <FiAward className="w-3.5 h-3.5" />}
                        {isWishlist ? 'Wishlist' : isTodo ? 'Tasks & Board' : 'Ideas'}
                      </span>

                      {isWishlist && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Gift Claiming
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {list.title}
                    </h3>

                    {list.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {list.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>
                      {list.item_count} {list.item_count === 1 ? 'item' : 'items'}
                      {list.completed_count > 0 && ` • ${list.completed_count} done`}
                    </span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-foreground font-semibold">
                      View →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
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
