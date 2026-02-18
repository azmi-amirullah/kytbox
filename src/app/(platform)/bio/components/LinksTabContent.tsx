'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  LuActivity as LuBarChart,
  LuLink,
  LuMousePointerClick,
  LuEye,
  LuPlus,
} from 'react-icons/lu';
import LinkList from './LinkList';
import LinkModal from './LinkModal';
import StatsCard from './StatsCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/types/supabase';

type LinkType = Database['public']['Tables']['links']['Row'];

interface LinksTabContentProps {
  links: LinkType[];
  setLinks: React.Dispatch<React.SetStateAction<LinkType[]>>;
  totalViews: number;
  isLoading?: boolean;
}

export default function LinksTabContent({
  links,
  setLinks,
  totalViews,
  isLoading,
}: LinksTabContentProps) {
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const activeLinksCount = links.filter((l) => l.is_active).length;

  return (
    <div className='space-y-4 min-w-0'>
      {/* Stats Bar */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        <StatsCard
          label='Profile Views'
          value={totalViews}
          icon={LuEye}
          href='/bio/analytics'
          isLoading={isLoading}
          variant='primary'
          description='Lifetime'
        />
        <StatsCard
          label='Clicks'
          value={totalClicks}
          icon={LuMousePointerClick}
          href='/bio/analytics'
          isLoading={isLoading}
          variant='blue'
          description='Lifetime'
        />
        <StatsCard
          label='Active'
          value={activeLinksCount}
          icon={LuLink}
          isLoading={isLoading}
          variant='green'
          description='Links'
        />
        <StatsCard
          label='Total'
          value={links.length}
          icon={LuBarChart}
          isLoading={isLoading}
          variant='orange'
          description='Links'
        />
      </div>

      {/* Links Editor */}
      <Card className='border-border bg-card shadow-sm p-0 gap-0'>
        <div className='flex items-center justify-end px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50'>
          {isLoading ? (
            <Skeleton className='h-8 w-24 rounded-md' />
          ) : (
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
          )}
        </div>
        <CardContent className='p-0'>
          <div className='p-4 sm:p-6 min-h-[400px]'>
            <LinkList links={links} setLinks={setLinks} isLoading={isLoading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
