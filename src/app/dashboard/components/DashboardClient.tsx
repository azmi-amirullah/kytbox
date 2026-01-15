'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  ExternalLink,
  BarChart3,
  Link as LinkIcon,
  MousePointerClick,
  Eye,
  Plus,
} from 'lucide-react';
import LinkList from './LinkList';
import LinkModal from './LinkModal';
import PhonePreview from './PhonePreview';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/supabase';

type Link = Database['public']['Tables']['links']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface DashboardClientProps {
  initialLinks: Link[];
  profile: Profile;
  publicUrl: string;
}

export default function DashboardClient({
  initialLinks,
  profile,
  publicUrl,
}: DashboardClientProps) {
  const [links, setLinks] = useState<Link[]>(initialLinks);

  // Derived state
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const activeLinksCount = links.filter((l) => l.is_active).length;

  return (
    <div className='grid lg:grid-cols-[1fr_400px] gap-8'>
      {/* Left Column: Editor */}
      <div className='space-y-6'>
        {/* Stats Bar */}
        <div className='grid grid-cols-3 gap-4'>
          <div className='bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-primary/20 transition-all duration-200'>
            <div>
              <p className='text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1'>
                Lifetime Clicks
              </p>
              <p className='text-2xl font-bold tracking-tight'>{totalClicks}</p>
            </div>
            <div className='p-3 bg-primary/10 rounded-full text-primary'>
              <MousePointerClick className='w-5 h-5' />
            </div>
          </div>

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
              <LinkIcon className='w-5 h-5' />
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
              <BarChart3 className='w-5 h-5' />
            </div>
          </div>
        </div>

        {/* Links Editor */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-bold tracking-tight'>Links</h2>
              <p className='text-sm text-muted-foreground'>
                Manage your links here
              </p>
            </div>
            <LinkModal
              mode='create'
              trigger={
                <Button className='h-10 font-medium shadow-md shadow-primary/20'>
                  <Plus className='w-4 h-4 mr-2' />
                  Add Link
                </Button>
              }
            />
          </div>

          <Card className='border-border/50 bg-card/40 backdrop-blur-xl shadow-sm'>
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
              <Eye className='w-4 h-4' /> Live Preview
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
              Open public page <ExternalLink className='w-3 h-3' />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
