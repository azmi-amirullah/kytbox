'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  LuType,
} from 'react-icons/lu';
import LinkList from './LinkList';
import LinkModal from './LinkModal';
import HeaderModal from './HeaderModal';
import StatsCard from './StatsCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { linkDtoListSchema } from '../schemas.client';
import type { LinkDTO } from '@/types/dto';

interface LinksTabContentProps {
  links: LinkDTO[];
  setLinks: React.Dispatch<React.SetStateAction<LinkDTO[]>>;
  totalViews: number;
  localTotalLinks: number;
  setLocalTotalLinks: React.Dispatch<React.SetStateAction<number>>;
  localActiveLinks: number;
  setLocalActiveLinks: React.Dispatch<React.SetStateAction<number>>;
  localRootTotalLinks: number;
  setLocalRootTotalLinks: React.Dispatch<React.SetStateAction<number>>;
  isLoading?: boolean;
}

export default function LinksTabContent({
  links,
  setLinks,
  totalViews,
  localTotalLinks,
  setLocalTotalLinks,
  localActiveLinks,
  setLocalActiveLinks,
  localRootTotalLinks,
  setLocalRootTotalLinks,
  isLoading,
}: LinksTabContentProps) {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(action === 'add');
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [prevAction, setPrevAction] = useState(action);

  if (action !== prevAction) {
    setPrevAction(action);
    if (action === 'add') {
      setIsAddModalOpen(true);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsAddModalOpen(open);
    if (!open && action === 'add') {
      const params = new URLSearchParams(window.location.search);
      params.delete('action');
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  };

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
        const limit = Math.max(50, visibleCount);
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
          const mapped = linkDtoListSchema.parse(res.links);
          allMapped.push(...mapped);

          if ('globalTotalCount' in res && res.globalTotalCount !== undefined) {
            setLocalTotalLinks(res.globalTotalCount);
          }
          if ('globalActiveCount' in res && res.globalActiveCount !== undefined) {
            setLocalActiveLinks(res.globalActiveCount);
          }
          if ('totalCount' in res && res.totalCount !== undefined) {
            if (parentId === null) setLocalRootTotalLinks(res.totalCount);
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
      const result = await loadMoreLinks(rootCount, 50);
      if ('error' in result && result.error) {
        toast.error('Failed to load more links: ' + result.error);
      } else if ('links' in result && result.links) {
        const mappedLinks = linkDtoListSchema.parse(result.links);

        // Update total and active counts from server
        if ('globalTotalCount' in result && result.globalTotalCount !== undefined) {
          setLocalTotalLinks(result.globalTotalCount);
        }
        if ('globalActiveCount' in result && result.globalActiveCount !== undefined) {
          setLocalActiveLinks(result.globalActiveCount);
        }

        if ('totalCount' in result && result.totalCount !== undefined) {
          setLocalRootTotalLinks(result.totalCount);
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
  // localActiveLinks is used for the display count

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
          value={localActiveLinks}
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
            <>
              <Button
                variant='outline'
                size='sm'
                className='font-medium shadow-sm mr-2'
                onClick={() => setIsHeaderModalOpen(true)}
              >
                <LuType className='w-4 h-4 mr-2' />
                Add Header
              </Button>
              <Button
                size='sm'
                className='font-medium shadow-md shadow-primary/20'
                onClick={() => handleOpenChange(true)}
              >
                <LuPlus className='w-4 h-4 mr-2' />
                Add Item
              </Button>
              <LinkModal
                mode='create'
                parentId={currentFolderId}
                open={isAddModalOpen}
                onOpenChange={handleOpenChange}
                onSuccess={async () => {
                  await refreshCurrentView();
                }}
              />
              <HeaderModal
                parentId={currentFolderId}
                open={isHeaderModalOpen}
                onOpenChange={setIsHeaderModalOpen}
                onSuccess={async () => {
                  await refreshCurrentView();
                }}
              />
            </>
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
              setLocalActiveLinks={setLocalActiveLinks}
            />
            {!isLoading && !currentFolderId && !isRefreshing && (links.filter(l => !l.parent_id).length < localRootTotalLinks || isLoadingMore) && (
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
