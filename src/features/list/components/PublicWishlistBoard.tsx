'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ListItemDTO, ListDTO } from '@/types/dto'
import {
  claimWishlistItemAction,
  unclaimWishlistItemAction,
  releaseWishlistItemClaimAction,
} from '@/features/list/actions'
import { Button } from '@/components/ui/button'
import {
  FiGift,
  FiExternalLink,
  FiCheck,
  FiUser,
  FiRotateCcw,
  FiX,
  FiSearch,
  FiMessageSquare,
} from 'react-icons/fi'

interface PublicWishlistBoardProps {
  list: ListDTO
  items: ListItemDTO[]
  guestClaims: { itemId: string; claimToken: string }[]
  isOwner: boolean
  creatorName: string
}

interface ClaimMetadata {
  claimed_by_name?: string
  claimed_at?: string
  claim_token?: string
  note?: string | null
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null
}

function extractClaimMetadata(rawMeta: unknown): ClaimMetadata | null {
  if (!isRecord(rawMeta)) {
    return null
  }
  if (!('claim' in rawMeta) || !isRecord(rawMeta.claim)) {
    return null
  }
  const claimObj = rawMeta.claim
  return {
    claimed_by_name:
      typeof claimObj.claimed_by_name === 'string'
        ? claimObj.claimed_by_name
        : undefined,
    claimed_at:
      typeof claimObj.claimed_at === 'string' ? claimObj.claimed_at : undefined,
    claim_token:
      typeof claimObj.claim_token === 'string'
        ? claimObj.claim_token
        : undefined,
    note: typeof claimObj.note === 'string' ? claimObj.note : null,
  }
}

export function PublicWishlistBoard({
  list,
  items: initialItems,
  guestClaims,
  isOwner,
  creatorName,
}: PublicWishlistBoardProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'available' | 'claimed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Claim modal state
  const [claimingItem, setClaimingItem] = useState<ListItemDTO | null>(null)
  const [claimedByName, setClaimedByName] = useState('')
  const [claimNote, setClaimNote] = useState('')
  const [claimError, setClaimError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Local claims token map
  const myClaimedItemTokens = new Map<string, string>()
  for (const claim of guestClaims) {
    myClaimedItemTokens.set(claim.itemId, claim.claimToken)
  }

  // Filter items
  const filteredItems = initialItems.filter((item) => {
    const claim = extractClaimMetadata(item.metadata)
    const isClaimed = Boolean(claim && claim.claimed_at)

    if (filter === 'available' && isClaimed) return false
    if (filter === 'claimed' && !isClaimed) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(q)
      const descMatch = item.description?.toLowerCase().includes(q)
      return titleMatch || descMatch
    }

    return true
  })

  const totalCount = initialItems.length
  const claimedCount = initialItems.filter((item) => {
    const rawMeta = item.metadata
    return Boolean(
      typeof rawMeta === 'object' &&
      rawMeta !== null &&
      'claim' in rawMeta &&
      rawMeta.claim,
    )
  }).length
  const availableCount = totalCount - claimedCount

  const handleOpenClaimModal = (item: ListItemDTO) => {
    setClaimingItem(item)
    setClaimedByName('')
    setClaimNote('')
    setClaimError(null)
  }

  const handleCloseClaimModal = () => {
    setClaimingItem(null)
    setClaimError(null)
  }

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimingItem) return

    if (!claimedByName.trim()) {
      setClaimError(
        'Please enter your name so the creator knows who sent the gift.',
      )
      return
    }

    setClaimError(null)
    startTransition(async () => {
      const res = await claimWishlistItemAction({
        itemId: claimingItem.id,
        claimedByName: claimedByName.trim(),
        note: claimNote.trim() || null,
      })

      if (res.error) {
        setClaimError(res.error)
      } else {
        handleCloseClaimModal()
        router.refresh()
      }
    })
  }

  const handleUnclaim = (itemId: string, token: string) => {
    if (!window.confirm('Are you sure you want to unclaim this gift?')) return

    startTransition(async () => {
      const res = await unclaimWishlistItemAction({
        itemId,
        claimToken: token,
      })

      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleOwnerRelease = (itemId: string) => {
    if (
      !window.confirm(
        'Release this claim? The gift will become available for anyone to claim again.',
      )
    )
      return

    startTransition(async () => {
      const res = await releaseWishlistItemClaimAction({
        itemId,
        listId: list.id,
      })

      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className='space-y-6'>
      {/* Filter and Search Bar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/60'>
        <div className='flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl'>
          <Button
            type='button'
            variant={filter === 'all' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setFilter('all')}
          >
            All ({totalCount})
          </Button>
          <Button
            type='button'
            variant={filter === 'available' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setFilter('available')}
          >
            Available ({availableCount})
          </Button>
          <Button
            type='button'
            variant={filter === 'claimed' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setFilter('claimed')}
          >
            Claimed ({claimedCount})
          </Button>
        </div>

        <div className='relative flex-1 sm:max-w-xs'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search wishlist...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary'
          />
        </div>
      </div>

      {/* Wishlist Items Grid */}
      {filteredItems.length === 0 ? (
        <div className='p-12 text-center rounded-2xl border border-dashed border-border bg-card/40'>
          <FiGift className='w-8 h-8 mx-auto text-muted-foreground/60 mb-2' />
          <p className='font-semibold text-foreground'>
            No gifts match this filter
          </p>
          <p className='text-xs text-muted-foreground mt-1'>
            Try choosing a different tab or clearing your search.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {filteredItems.map((item) => {
            const rawMeta = item.metadata
            const claim = extractClaimMetadata(rawMeta)
            const isClaimed = Boolean(claim && claim.claimed_at)

            const price =
              typeof rawMeta === 'object' &&
              rawMeta !== null &&
              'price' in rawMeta
                ? Number(rawMeta.price)
                : null
            const currency =
              typeof rawMeta === 'object' &&
              rawMeta !== null &&
              'currency' in rawMeta
                ? String(rawMeta.currency || '')
                : ''
            const purchaseUrl =
              typeof rawMeta === 'object' &&
              rawMeta !== null &&
              'purchase_url' in rawMeta
                ? String(rawMeta.purchase_url || '')
                : ''

            const myToken = myClaimedItemTokens.get(item.id)
            const isClaimedByMe = Boolean(myToken)

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isClaimed
                    ? 'bg-muted/20 border-border/40 opacity-90'
                    : 'bg-card border-border/80 shadow-xs hover:border-primary/40'
                }`}
              >
                <div className='space-y-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-1'>
                      <h3
                        className={`font-bold text-base text-foreground leading-snug ${
                          isClaimed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.title}
                      </h3>
                      {price !== null && !isNaN(price) && price > 0 && (
                        <p className='text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                          {currency ? `${currency} ` : '$'}
                          {price.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    {isClaimed ? (
                      <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0'>
                        <FiCheck className='w-3 h-3' />
                        {isClaimedByMe
                          ? 'Claimed by you'
                          : claim?.claimed_by_name
                            ? `Claimed by ${claim.claimed_by_name}`
                            : 'Claimed'}
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0'>
                        Available
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className='text-xs text-muted-foreground leading-relaxed'>
                      {item.description}
                    </p>
                  )}

                  {isOwner && claim?.note && (
                    <div className='flex items-start gap-1.5 p-2.5 rounded-xl bg-muted/60 text-xs text-foreground mt-2 border border-border/60'>
                      <FiMessageSquare className='w-3.5 h-3.5 text-primary shrink-0 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='font-semibold text-[11px] block text-foreground'>
                          Note from {claim.claimed_by_name || 'Guest'}:
                        </span>
                        <p className='italic text-muted-foreground wrap-break-word mt-0.5'>
                          &ldquo;{claim.note}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className='pt-4 mt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-2'>
                  {purchaseUrl ? (
                    <a
                      href={purchaseUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline'
                    >
                      <span>Buy / View Gift</span>
                      <FiExternalLink className='w-3 h-3' />
                    </a>
                  ) : (
                    <div />
                  )}

                  <div className='flex items-center gap-2'>
                    {/* Guest Claim Button */}
                    {!isClaimed && (
                      <Button
                        type='button'
                        size='sm'
                        onClick={() => handleOpenClaimModal(item)}
                      >
                        <FiGift />
                        <span>Claim Gift</span>
                      </Button>
                    )}

                    {/* Guest Unclaim Button */}
                    {isClaimed && isClaimedByMe && myToken && (
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        disabled={isPending}
                        onClick={() => handleUnclaim(item.id, myToken)}
                      >
                        <span>Unclaim</span>
                      </Button>
                    )}

                    {/* Owner Administrative Reset Override */}
                    {isClaimed && isOwner && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={isPending}
                        onClick={() => handleOwnerRelease(item.id)}
                        title='Release claim and make gift available again'
                      >
                        <FiRotateCcw />
                        <span>Release</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Claim Gift Dialog Modal */}
      {claimingItem && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150'>
          <div className='w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 text-primary'>
                <FiGift className='w-5 h-5' />
                <h3 className='font-bold text-base sm:text-lg text-foreground'>
                  Claim Gift
                </h3>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={handleCloseClaimModal}
                aria-label='Close claim modal'
              >
                <FiX className='w-4 h-4' />
              </Button>
            </div>

            <div className='p-3 rounded-xl bg-muted/50 border border-border/50 text-xs sm:text-sm text-foreground space-y-1'>
              <p className='font-bold'>{claimingItem.title}</p>
              <p className='text-muted-foreground text-xs'>
                Claiming lets others know this gift is being taken so two people
                don&apos;t buy the same item. No account is required!
              </p>
            </div>

            {claimError && (
              <div className='p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20'>
                {claimError}
              </div>
            )}

            <form onSubmit={handleSubmitClaim} className='space-y-4'>
              <div className='space-y-1.5'>
                <label
                  htmlFor='claimedByName'
                  className='text-xs font-bold text-foreground flex items-center gap-1'
                >
                  <FiUser className='w-3.5 h-3.5 text-muted-foreground' />
                  Your Name <span className='text-rose-500'>*</span>
                </label>
                <input
                  id='claimedByName'
                  name='claimedByName'
                  type='text'
                  required
                  placeholder='e.g. Aunt Sarah, Alex, Team Marketing'
                  value={claimedByName}
                  onChange={(e) => setClaimedByName(e.target.value)}
                  className='w-full px-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary'
                />
              </div>

              <div className='space-y-1.5'>
                <label
                  htmlFor='claimNote'
                  className='text-xs font-bold text-foreground'
                >
                  Note to {creatorName} (Optional)
                </label>
                <textarea
                  id='claimNote'
                  name='claimNote'
                  placeholder="e.g. Can't wait to see you at the celebration!"
                  rows={2}
                  value={claimNote}
                  onChange={(e) => setClaimNote(e.target.value)}
                  className='w-full px-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none'
                />
              </div>

              <div className='flex items-center justify-end gap-2 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleCloseClaimModal}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  loading={isPending}
                  disabled={isPending}
                >
                  Confirm Claim
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
