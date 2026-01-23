'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  LuExternalLink,
  LuActivity as LuBarChart,
  LuLink,
  LuMousePointerClick,
  LuEye,
  LuPlus,
  LuChevronRight,
} from 'react-icons/lu';
import LinkList from './LinkList';
import LinkModal from './LinkModal';
import PhonePreview from './PhonePreview';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/supabase';

type LinkType = Database['public']['Tables']['links']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface DashboardClientProps {
  initialLinks: LinkType[];
  profile: Profile;
  publicUrl: string;
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
}: DashboardClientProps) {
  // Initialize state from props. Server-side revalidation will provide fresh initialLinks
  // on navigation, and React's default behavior handles this correctly.
  const [links, setLinks] = useState<LinkType[]>(initialLinks);

  // Derived state
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const activeLinksCount = links.filter((l) => l.is_active).length;

  return (
    <div className='grid lg:grid-cols-[1fr_400px] gap-8'>
      {/* Left Column: Editor */}
      <div className='space-y-6'>
        {/* Breadcrumb + Title */}
        <div>
          <nav className='flex items-center gap-1 text-sm text-muted-foreground mb-2'>
            <Link
              href='/app'
              className='hover:text-foreground transition-colors'
            >
              UKIT
            </Link>
            <LuChevronRight className='w-3 h-3' />
            <span className='text-foreground font-medium'>Bio</span>
          </nav>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Bio
          </h1>
          <p className='text-muted-foreground mt-1'>Manage your links here</p>
        </div>

        {/* Stats Bar */}
        <div className='grid grid-cols-3 gap-4'>
          <Link href='/app/bio/analytics' className='block group'>
            <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm group-hover:border-primary transition-all duration-200 cursor-pointer h-full'>
              <div>
                <p className='text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 group-hover:text-primary transition-colors'>
                  Lifetime Clicks
                </p>
                <p className='text-2xl font-bold tracking-tight'>
                  {totalClicks}
                </p>
              </div>
              <div className='p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform'>
                <LuMousePointerClick className='w-5 h-5' />
              </div>
            </div>
          </Link>

          <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-green-500/20 transition-all duration-200'>
            <div>
              <p className='text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1'>
                Active Links
              </p>
              <p className='text-2xl font-bold tracking-tight'>
                {activeLinksCount}
              </p>
            </div>
            <div className='p-3 bg-green-500/10 rounded-full text-green-600'>
              <LuLink className='w-5 h-5' />
            </div>
          </div>

          <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-blue-500/20 transition-all duration-200'>
            <div>
              <p className='text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1'>
                Total Links
              </p>
              <p className='text-2xl font-bold tracking-tight'>
                {links.length}
              </p>
            </div>
            <div className='p-3 bg-blue-500/10 rounded-full text-blue-600'>
              <LuBarChart className='w-5 h-5' />
            </div>
          </div>
        </div>

        {/* Links Editor */}
        <div className='space-y-4'>
          <Card className='border-border bg-card shadow-sm p-0 gap-0'>
            <div className='flex items-center justify-end px-6 py-4 border-b border-border/50'>
              <LinkModal
                mode='create'
                trigger={
                  <Button
                    size='sm'
                    className='font-medium shadow-md shadow-primary/20'
                  >
                    <LuPlus className='w-4 h-4 mr-2' />
                    Add Link
                  </Button>
                }
              />
            </div>
            <CardContent className='p-0'>
              <div className='p-6 min-h-[400px]'>
                <LinkList links={links} setLinks={setLinks} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column: Live Preview (Hidden on small screens, Sticky on large) */}
      <div className='hidden lg:block'>
        <div className='sticky top-24'>
          <div className='flex items-center justify-center mb-4 gap-2'>
            <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
              <LuEye className='w-4 h-4' /> Live Preview
            </h3>
          </div>
          <PhonePreview
            profile={{
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              bio: profile.bio,
            }}
            links={links}
          />
          <div className='text-center mt-6'>
            <a
              href={publicUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 text-sm text-primary hover:underline'
            >
              Open public page <LuExternalLink className='w-3 h-3' />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
