import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ThemeConfig } from '@/lib/theme/theme.types'

interface ProfileHeaderProps {
  profile: {
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  }
  theme: ThemeConfig
  isLoading?: boolean
}

export default function ProfileHeader({
  profile,
  theme,
  isLoading,
}: ProfileHeaderProps) {
  const { colors } = theme

  return (
    <div className='flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-700 fill-mode-both mb-4'>
      <div className='relative inline-block mb-6'>
        {isLoading ? (
          <Skeleton className='w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full' />
        ) : profile.avatar_url ? (
          <div
            className={cn(
              'relative overflow-hidden w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 ring-2 rounded-full shadow-sm',
              colors.elementRing,
            )}
          >
            <Image
              src={profile.avatar_url}
              alt={profile.display_name || profile.username || 'Avatar'}
              fill
              sizes='(max-width: 768px) 112px, (max-width: 1024px) 128px, 160px'
              className='object-cover'
              priority
            />
          </div>
        ) : (
          <div
            className={cn(
              'rounded-full flex items-center justify-center font-semibold shadow-sm backdrop-blur-sm ring-2 w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 text-4xl md:text-5xl lg:text-6xl',
              colors.elementBg,
              colors.textPrimary,
              colors.elementRing,
            )}
          >
            {(profile.display_name || profile.username || '?')
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
      </div>

      <div className='text-center w-full px-4'>
        {isLoading ? (
          <div className='flex flex-col items-center space-y-2 w-full'>
            <Skeleton className='h-8 w-48 md:h-10 md:w-64 rounded-md' />
            <Skeleton className='h-4 w-64 md:h-6 md:w-80 rounded-md' />
          </div>
        ) : (
          <>
            <h1
              className={cn(
                'font-bold tracking-tight max-w-full text-3xl mb-2',
                colors.textPrimary,
              )}
            >
              {profile.display_name || profile.username || 'Your Name'}
            </h1>
            {profile.bio && (
              <p
                className={cn(
                  'mx-auto leading-relaxed text-lg md:text-xl max-w-85 md:max-w-xl text-balance',
                  colors.textSecondary,
                )}
              >
                {profile.bio}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
