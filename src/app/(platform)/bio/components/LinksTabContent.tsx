'use client';
import { useState, useEffect } from 'react';
import { loadMoreLinks, loadFolderLinks } from '../actions';
import { toast } from 'react-toastify';

import { Card, CardContent } from '@/components/ui/card';
import {
  LuActivity as LuBarChart,
  LuLink,
  LuMousePointerClick,
  LuEye,
  LuPlus,
  LuLoader,
} from 'react-icons/lu';
import LinkList from './LinkList';
import LinkModal from './LinkModal';
import StatsCard from './StatsCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { rawLinkListSchema } from '@/lib/validation.schemas.client';
import type { LinkDTO } from '@/types/dto';

interface LinksTabContentProps {
  links: LinkDTO[];
  setLinks: React.Dispatch<React.SetStateAction<LinkDTO[]>>;
  totalViews: number;
  localTotalLinks: number;
  setLocalTotalLinks: React.Dispatch<React.SetStateAction<number>>;
  isLoading?: boolean;
}

export default function LinksTabContent({
  links,
  setLinks,
  totalViews,
  localTotalLinks,
  setLocalTotalLinks,
  isLoading,
}: LinksTabContentProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});

  // Sync folder counts from links child_count prop
  useEffect(() => {
    // Sync folder counts from links child_count
    const newCounts: Record<string, number> = {};
    links.forEach(l => {
      if (l.is_folder && l.child_count !== undefined) {
        newCounts[l.id] = l.child_count;
      }
    });
    setFolderCounts(prev => {
      const merged = { ...prev, ...newCounts };
      return JSON.stringify(merged) === JSON.stringify(prev) ? prev : merged;
    });
  }, [links]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshCurrentView = async (alsoRefreshRoot: boolean = false) => {
    setIsRefreshing(true);

    try {
      // 1. Determine jobs
      const jobs = [{ parentId: currentFolderId }];
      if (alsoRefreshRoot && currentFolderId !== null) {
        jobs.push({ parentId: null });
      }

      // 2. Fetch segments in parallel
      const results = await Promise.all(jobs.map(async (job) => {
        const visibleCount = links.filter(l => job.parentId ? l.parent_id === job.parentId : !l.parent_id).length;
        const limit = Math.max(2, visibleCount);
        const res = job.parentId 
          ? await loadFolderLinks(job.parentId, 0, limit)
          : await loadMoreLinks(0, limit);
        return { parentId: job.parentId, res };
      }));

      // 3. Process and batch update
      const allMapped: LinkDTO[] = [];
      const updatedParentIds = new Set<string | null>();

      results.forEach(({ parentId, res }) => {
        if ('links' in res && res.links) {
          updatedParentIds.add(parentId);
          const raw = rawLinkListSchema.parse(res.links);
          const mapped = raw.map((l) => ({
            id: l.id,
            title: l.title,
            url: l.url || '',
            sort_order: l.sort_order,
            is_active: l.is_active,
            clicks: l.clicks,
            is_folder: l.is_folder,
            parent_id: l.parent_id,
            animation_type: l.animation_type,
            child_count: l.children?.[0]?.count ?? l.child_count ?? 0,
          }));
          allMapped.push(...mapped);

          if ('totalCount' in res && res.totalCount !== undefined) {
            if (parentId === null) setLocalTotalLinks(res.totalCount);
            else setFolderCounts(prev => ({ ...prev, [parentId]: res.totalCount! }));
          }
        }
      });

      setLinks((prev) => {
        const others = prev.filter((p) => !updatedParentIds.has(p.parent_id));
        return [...others, ...allMapped].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      });

    } catch (e) {
      console.error('Refresh failed', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const rootCount = links.filter((l) => !l.parent_id).length;
      const result = await loadMoreLinks(rootCount, 2);
      if ('error' in result && result.error) {
        toast.error('Failed to load more links: ' + result.error);
      } else if ('links' in result && result.links) {
        const rawLinks = rawLinkListSchema.parse(result.links);
        const mappedLinks: LinkDTO[] = rawLinks.map((l) => ({
          id: l.id,
          title: l.title,
          url: l.url || '',
          sort_order: l.sort_order,
          is_active: l.is_active,
          clicks: l.clicks,
          is_folder: l.is_folder,
          parent_id: l.parent_id,
          animation_type: l.animation_type,
          child_count: l.children?.[0]?.count ?? l.child_count ?? 0,
        }));

        // Update total first to prevent flicker
        if (mappedLinks.length < 2) {
          const currentRootCount = links.filter(l => !l.parent_id).length + mappedLinks.length;
          setLocalTotalLinks(currentRootCount);
        } else if ('totalCount' in result && result.totalCount !== undefined) {
          setLocalTotalLinks(result.totalCount);
        }

        setLinks((prev) => {
          const serverIds = new Set(mappedLinks.map((m) => m.id));
          const filteredPrev = prev.filter((p) => !serverIds.has(p.id));
          return [...filteredPrev, ...mappedLinks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        });
      }
    } catch (error) {
      console.error('Failed to load more links', error);
      toast.error('Failed to load more links');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks ?? 0), 0);
  const activeLinksCount = links.filter((l) => !!l.is_active).length;

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
          value={localTotalLinks}
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
              parentId={currentFolderId}
              onSuccess={async () => {
                await refreshCurrentView();
              }}
              trigger={
                <Button
                  size='sm'
                  className='font-medium shadow-md shadow-primary/20'
                >
                  <LuPlus className='w-4 h-4 mr-2' />
                  Add Item
                </Button>
              }
            />
          )}
        </div>
        <CardContent className='p-0'>
          <div className='p-4 sm:p-6 min-h-[400px]'>
            <LinkList
              links={links}
              setLinks={setLinks}
              isLoading={isLoading}
              currentFolderId={currentFolderId}
              onDrillDown={setCurrentFolderId}
              folderCounts={folderCounts}
              setFolderCounts={setFolderCounts}
              onRefreshView={refreshCurrentView}
            />
            {!isLoading && !currentFolderId && !isRefreshing && (links.filter(l => !l.parent_id).length < localTotalLinks || isLoadingMore) && (
              <div className='mt-6 flex justify-center'>
                <Button 
                  variant='outline' 
                  onClick={handleLoadMore} 
                  disabled={isLoadingMore}
                  className='min-w-[140px] shadow-sm'
                >
                  {isLoadingMore ? (
                    <>
                      <LuLoader className='w-4 h-4 mr-2 animate-spin' />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
