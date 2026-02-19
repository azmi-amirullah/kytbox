'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LuEye, LuLink, LuPalette } from 'react-icons/lu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LinksTabContent from './LinksTabContent';
import PhonePreview from './PhonePreview';
import AppearanceEditor from './AppearanceEditor';
import type { Database } from '@/types/supabase';
import { cn } from '@/lib/utils';

type LinkType = Database['public']['Tables']['links']['Row'];
export type Profile = Omit<
  Database['public']['Tables']['profiles']['Row'],
  'social_links'
> & {
  social_links?: Record<string, string> | null;
};

export type BioTab = 'links' | 'appearance';
export const VALID_TABS: BioTab[] = ['links', 'appearance'];
export const DEFAULT_TAB: BioTab = 'links';

interface DashboardClientProps {
  initialLinks: LinkType[];
  profile: Profile;
  publicUrl: string;
  totalViews: number;
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
  isLoading,
  activeTab = DEFAULT_TAB,
}: DashboardClientProps) {
  const [currentTab, setCurrentTab] = useState<BioTab>(activeTab);

  const [links, setLinks] = useState<LinkType[]>(initialLinks);
  const [themeName, setThemeName] = useState(profile?.theme_name || 'default');
  const [buttonStyle, setButtonStyle] = useState(
    profile?.button_style || 'default',
  );
  const [buttonShape, setButtonShape] = useState(
    profile?.button_shape || 'rounded',
  );
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    (profile?.social_links as Record<string, string>) || {},
  );

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const handleTabChange = useCallback((value: string) => {
    const newTab = value as BioTab;
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
              totalViews={totalViews}
              isLoading={isLoading}
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
              initialTheme={profile?.theme_name || 'default'}
              initialButtonStyle={profile?.button_style || 'default'}
              initialButtonShape={profile?.button_shape || 'rounded'}
              initialSocialLinks={
                (profile?.social_links as Record<string, string>) || {}
              }
              onPreviewUpdate={(
                theme: string,
                style: string,
                shape: string,
                social: Record<string, string>,
              ) => {
                setThemeName(theme);
                setButtonStyle(style);
                setButtonShape(shape);
                setSocialLinks(social);
              }}
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
              username: profile?.username || '',
              display_name: profile?.display_name || '',
              avatar_url: profile?.avatar_url || null,
              bio: profile?.bio || null,
              theme_name: themeName,
              button_style: buttonStyle,
              button_shape: buttonShape,
              social_links: socialLinks,
            }}
            links={links}
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
