'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { bioTabSchema, socialLinksSchema } from '../schemas.client'
import { LuEye, LuLink, LuPalette, LuUsers, LuSettings } from 'react-icons/lu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav'
import LinksTabContent from './LinksTabContent'
import PhonePreview from './PhonePreview'
import AppearanceEditor from './AppearanceEditor'
import SubscribersList from './SubscribersList'
import CustomDomainModal from './CustomDomainModal'
import type { ProfileDTO, LinkDTO, BioSubscriberDTO, CustomDomainDTO } from '@/types/dto'
import type { LinkClickTrend } from '../db'
import type { CustomThemeData } from '@/lib/theme/theme.types'
import { cn } from '@/lib/utils'

export type ProfileWithTheme = Omit<
  ProfileDTO,
  'social_links' | 'custom_theme'
> & {
  social_links?: Record<string, string> | null
  custom_theme?: CustomThemeData | null
  theme_name?: string | null
  button_style?: string | null
  button_shape?: string | null
  display_name?: string | null
  lead_capture_enabled?: boolean
}

export type BioTab = 'links' | 'appearance' | 'subscribers'
export const VALID_TABS: BioTab[] = ['links', 'appearance', 'subscribers']
export const DEFAULT_TAB: BioTab = 'links'

interface DashboardClientProps {
  initialLinks: LinkDTO[]
  initialSubscribers?: BioSubscriberDTO[]
  totalSubscribers?: number
  profile: Partial<ProfileWithTheme>
  publicUrl: string
  totalViews: number
  totalLinks?: number
  activeLinksCount?: number
  rootTotalCount?: number
  activeRootTotalCount?: number
  isLoading?: boolean
  activeTab?: BioTab
  clickTrends?: Record<string, LinkClickTrend>
  initialCustomDomain?: CustomDomainDTO | null
}

/**
 * Client component for managing Bio links.
 * Note: If you need to fully reset this component's state (e.g., after a major data change),
 * pass a `key` prop from the parent to force a remount.
 */
export default function DashboardClient({
  initialLinks,
  initialSubscribers = [],
  totalSubscribers = 0,
  profile,
  publicUrl,
  totalViews,
  totalLinks = 0,
  activeLinksCount = 0,
  rootTotalCount = 0,
  activeRootTotalCount = 0,
  isLoading,
  activeTab = DEFAULT_TAB,
  clickTrends,
  initialCustomDomain = null,
}: DashboardClientProps) {
  const searchParams = useSearchParams()
  const urlTab = bioTabSchema.parse(searchParams.get('tab'))
  const resolvedTab = urlTab && VALID_TABS.includes(urlTab) ? urlTab : activeTab
  const [currentTab, setCurrentTab] = useState<BioTab>(resolvedTab)

  const [links, setLinks] = useState<LinkDTO[]>(initialLinks)
  const [localTotalLinks, setLocalTotalLinks] = useState(totalLinks)
  const [localActiveLinks, setLocalActiveLinks] = useState(activeLinksCount)
  const [localRootTotalLinks, setLocalRootTotalLinks] = useState(rootTotalCount)
  const [themeName, setThemeName] = useState(profile?.theme_name || 'default')
  const [customTheme, setCustomTheme] = useState<CustomThemeData | null>(
    profile?.custom_theme || null,
  )
  const [buttonStyle, setButtonStyle] = useState(
    profile?.button_style || 'default',
  )
  const [buttonShape, setButtonShape] = useState(
    profile?.button_shape || 'rounded',
  )
  const initialSocials = socialLinksSchema.parse(profile?.social_links)

  const [socialLinks, setSocialLinks] =
    useState<Record<string, string>>(initialSocials)
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(
    profile?.lead_capture_enabled ?? true,
  )
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false)

  // Merge initialLinks from props whenever they change (Single source of truth for the first batch)
  useEffect(() => {
    setLocalTotalLinks(totalLinks)
    setLocalActiveLinks(activeLinksCount)
    setLocalRootTotalLinks(rootTotalCount)
    if (initialLinks.length > 0) {
      setLinks((prev) => {
        const serverIds = new Set(initialLinks.map((l) => l.id))
        // Keep local items that are NOT in the current server batch (e.g. pagination or other folders)
        const otherItems = prev.filter((p) => !serverIds.has(p.id))
        return [...otherItems, ...initialLinks].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        )
      })
    }
  }, [initialLinks, totalLinks, activeLinksCount, rootTotalCount])

  useEffect(() => {
    setCurrentTab(resolvedTab)
  }, [resolvedTab])

  const handleTabChange = useCallback((value: string) => {
    const newTab = bioTabSchema.parse(value)
    setCurrentTab(newTab)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', value)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }, [])

  return (
    <div className='grid lg:grid-cols-[1fr_440px] gap-4 lg:gap-8'>
      {/* Left Column: Editor */}
      <div className='space-y-4 md:space-y-6 min-w-0'>
        {/* Header Section */}
        <div className='space-y-1.5 sm:space-y-2'>
          <BreadcrumbNav />
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                Bio
              </h1>
              <p className='text-muted-foreground mt-1'>Manage your bio page</p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsDomainModalOpen(true)}
              className='gap-2 text-xs font-medium shrink-0'
              title='Custom Domain Setup'
            >
              <LuSettings className='w-3.5 h-3.5 text-muted-foreground' />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className='w-full sm:w-auto'>
            <TabsTrigger value='links' className='gap-2'>
              <LuLink className='w-4 h-4' />
              <span>Links</span>
            </TabsTrigger>
            <TabsTrigger value='appearance' className='gap-2'>
              <LuPalette className='w-4 h-4' />
              <span>Appearance</span>
            </TabsTrigger>
            <TabsTrigger value='subscribers' className='gap-2'>
              <LuUsers className='w-4 h-4' />
              <span>Subscribers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value='links'
            forceMount
            className={cn('mt-2', currentTab !== 'links' && 'hidden')}
          >
            <LinksTabContent
              links={links}
              setLinks={setLinks}
              localTotalLinks={localTotalLinks}
              setLocalTotalLinks={setLocalTotalLinks}
              localActiveLinks={localActiveLinks}
              setLocalActiveLinks={setLocalActiveLinks}
              localRootTotalLinks={localRootTotalLinks}
              setLocalRootTotalLinks={setLocalRootTotalLinks}
              totalViews={totalViews}
              isLoading={isLoading}
              username={profile?.username}
              publicUrl={publicUrl}
              clickTrends={clickTrends}
            />
          </TabsContent>

          <TabsContent
            value='appearance'
            forceMount
            className={cn(
              'mt-4 md:mt-6',
              currentTab !== 'appearance' && 'hidden',
            )}
          >
            <AppearanceEditor
              initialTheme={isLoading ? '' : profile?.theme_name || 'default'}
              initialButtonStyle={
                isLoading ? '' : profile?.button_style || 'default'
              }
              initialButtonShape={
                isLoading ? '' : profile?.button_shape || 'rounded'
              }
              initialSocialLinks={isLoading ? {} : initialSocials}
              initialCustomTheme={
                isLoading ? null : profile?.custom_theme || null
              }
              initialMetaTitle={isLoading ? '' : profile?.meta_title || ''}
              initialMetaDescription={
                isLoading ? '' : profile?.meta_description || ''
              }
              initialOgImageUrl={isLoading ? '' : profile?.og_image_url || ''}
              isLoading={isLoading}
              onPreviewUpdate={useCallback(
                (
                  theme: string,
                  style: string,
                  shape: string,
                  social: Record<string, string>,
                  custom?: CustomThemeData | null,
                ) => {
                  setThemeName(theme)
                  setButtonStyle(style)
                  setButtonShape(shape)
                  setSocialLinks(social)
                  if (custom !== undefined) setCustomTheme(custom)
                },
                [],
              )}
            />
          </TabsContent>

          <TabsContent
            value='subscribers'
            forceMount
            className={cn(
              'mt-4 md:mt-6',
              currentTab !== 'subscribers' && 'hidden',
            )}
          >
            <SubscribersList
              initialSubscribers={initialSubscribers}
              totalSubscribers={totalSubscribers}
              username={profile?.username}
              initialLeadCaptureEnabled={leadCaptureEnabled}
              onToggleLeadCapture={(enabled) => setLeadCaptureEnabled(enabled)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Column: Live Preview (Hidden on small screens, Sticky on large) */}
      <div className='hidden lg:block'>
        <div className='sticky top-24'>
          <div className='flex items-center justify-center mb-4 gap-2'>
            <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2 select-none'>
              <LuEye className='w-4 h-4' /> Live Preview
            </h3>
          </div>
          <PhonePreview
            profile={{
              id: profile?.id || '',
              username: profile?.username || '',
              display_name: profile?.display_name || '',
              avatar_url: profile?.avatar_url || null,
              bio: profile?.bio || null,
              theme_name: themeName,
              custom_theme: customTheme,
              button_style: buttonStyle,
              button_shape: buttonShape,
              social_links: socialLinks,
              lead_capture_enabled: leadCaptureEnabled,
            }}
            links={useMemo(
              () =>
                links.map((l) => ({
                  ...l,
                  is_active: !!l.is_active,
                  sort_order: l.sort_order ?? 0,
                })),
              [links],
            )}
            totalLinks={activeRootTotalCount}
            isLoading={isLoading}
          />
        </div>
      </div>

      <CustomDomainModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        initialCustomDomain={initialCustomDomain}
      />
    </div>
  )
}
