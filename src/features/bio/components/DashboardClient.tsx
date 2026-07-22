'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  bioTabSchema,
  socialLinksSchema,
} from '../schemas.client';
import { LuEye, LuLink, LuPalette } from 'react-icons/lu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LinksTabContent from './LinksTabContent';
import PhonePreview from './PhonePreview';
import AppearanceEditor from './AppearanceEditor';
import type { ProfileDTO, LinkDTO } from '@/types/dto';
import type { CustomThemeData } from '@/lib/theme/theme.types';
import { cn } from '@/lib/utils';

export type ProfileWithTheme = Omit<
  ProfileDTO,
  'social_links' | 'custom_theme'
> & {
  social_links?: Record<string, string> | null;
  custom_theme?: CustomThemeData | null;
  theme_name?: string | null;
  button_style?: string | null;
  button_shape?: string | null;
  display_name?: string | null;
};

export type BioTab = 'links' | 'appearance';
export const VALID_TABS: BioTab[] = ['links', 'appearance'];
export const DEFAULT_TAB: BioTab = 'links';

interface DashboardClientProps {
  initialLinks: LinkDTO[];
  profile: Partial<ProfileWithTheme>;
  publicUrl: string;
  totalViews: number;
  totalLinks?: number;
  activeLinksCount?: number;
  rootTotalCount?: number;
  activeRootTotalCount?: number;
  isLoading?: boolean;
  activeTab?: BioTab;
}

/**
 * Client component for managing Bio links.
 * Note: If you need to fully reset this component's state (e.g., after a major data change),
 * pass a `key` prop from the parent to force a remount.
 */
export default function DashboardClient({
  initialLinks,
  profile,
  publicUrl,
  totalViews,
  totalLinks = 0,
  activeLinksCount = 0,
  rootTotalCount = 0,
  activeRootTotalCount = 0,
  isLoading,
  activeTab = DEFAULT_TAB,
}: DashboardClientProps) {
  const searchParams = useSearchParams();
  const urlTab = bioTabSchema.parse(searchParams.get('tab'));
  const resolvedTab =
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : activeTab;
  const [currentTab, setCurrentTab] = useState<BioTab>(resolvedTab);

  const [links, setLinks] = useState<LinkDTO[]>(initialLinks);
  const [localTotalLinks, setLocalTotalLinks] = useState(totalLinks);
  const [localActiveLinks, setLocalActiveLinks] = useState(activeLinksCount);
  const [localRootTotalLinks, setLocalRootTotalLinks] = useState(rootTotalCount);
  const [themeName, setThemeName] = useState(profile?.theme_name || 'default');
  const [customTheme, setCustomTheme] = useState<CustomThemeData | null>(
    profile?.custom_theme || null,
  );
  const [buttonStyle, setButtonStyle] = useState(
    profile?.button_style || 'default',
  );
  const [buttonShape, setButtonShape] = useState(
    profile?.button_shape || 'rounded',
  );
  const initialSocials = socialLinksSchema.parse(profile?.social_links);

  const [socialLinks, setSocialLinks] =
    useState<Record<string, string>>(initialSocials);

  // Merge initialLinks from props whenever they change (Single source of truth for the first batch)
  useEffect(() => {
    setLocalTotalLinks(totalLinks);
    setLocalActiveLinks(activeLinksCount);
    setLocalRootTotalLinks(rootTotalCount);
    if (initialLinks.length > 0) {
      setLinks((prev) => {
        const serverIds = new Set(initialLinks.map((l) => l.id));
        // Keep local items that are NOT in the current server batch (e.g. pagination or other folders)
        const otherItems = prev.filter((p) => !serverIds.has(p.id));
        return [...otherItems, ...initialLinks].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
      });
    }
  }, [initialLinks, totalLinks, activeLinksCount, rootTotalCount]);

  useEffect(() => {
    setCurrentTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = useCallback((value: string) => {
    const newTab = bioTabSchema.parse(value);
    setCurrentTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', value);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, []);

  return (
    <div className='grid lg:grid-cols-[1fr_440px] gap-4 lg:gap-8'>
      {/* Left Column: Editor */}
      <div className='space-y-4 md:space-y-6 min-w-0'>
        {/* Breadcrumb + Title */}
        <div>
          <nav className='flex items-center gap-1 text-sm text-muted-foreground mb-2'>
            <Link
              href='/app'
              className='hover:text-foreground transition-colors'
            >
              Kytbox
            </Link>
            <span className='text-muted-foreground'>/</span>
            <span className='text-foreground font-medium'>Bio</span>
          </nav>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Bio
          </h1>
          <p className='text-muted-foreground mt-1'>Manage your bio page</p>
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
              isLoading={isLoading}
              onPreviewUpdate={useCallback(
                (
                  theme: string,
                  style: string,
                  shape: string,
                  social: Record<string, string>,
                  custom?: CustomThemeData | null,
                ) => {
                  setThemeName(theme);
                  setButtonStyle(style);
                  setButtonShape(shape);
                  setSocialLinks(social);
                  if (custom !== undefined) setCustomTheme(custom);
                },
                [],
              )}
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

      {/* Mobile Preview FAB */}
      {!isLoading && (
        <div className='lg:hidden fixed bottom-6 right-3 z-60'>
          <Link
            href={publicUrl}
            target='_blank'
            className='flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg font-bold text-sm'
          >
            <LuEye className='w-4 h-4' /> Preview
          </Link>
        </div>
      )}
    </div>
  );
}
