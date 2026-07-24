'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LinkButton } from './LinkButton';
import type { ThemeConfig } from '@/lib/theme/theme.types';
import { LuArrowLeft, LuFolderOpen, LuSearch, LuX } from 'react-icons/lu';
import { loadMorePublicLinks, loadMorePublicFolderLinks } from '../actions';

interface ProfileLinksProps {
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
    short_id?: string | number | null;
    is_folder?: boolean;
    is_header?: boolean;
    parent_id?: string | null;
    sort_order?: number | null;
    animation_type?: string | null;
    child_count?: number;
    scheduled_at?: string | null;
    expires_at?: string | null;
  }[];
  username: string;
  profileId: string;
  totalLinks?: number;
  theme: ThemeConfig;
  buttonClasses: string;
  isLoading?: boolean;
}

export default function ProfileLinks({
  links: initialLinks,
  username,
  profileId,
  totalLinks = 0,
  theme,
  buttonClasses,
  isLoading,
}: ProfileLinksProps) {
  const { colors } = theme;
  const [links, setLinks] = useState(initialLinks);
  const [localTotalLinks, setLocalTotalLinks] = useState(totalLinks);
  const activeLinks = links.filter((l) => {
    if (!l.is_active) return false;
    const now = new Date();
    if (l.scheduled_at && new Date(l.scheduled_at) > now) return false;
    if (l.expires_at && new Date(l.expires_at) < now) return false;
    return true;
  });

  // Sync state if initialLinks prop changes (e.g. from server-side navigation or dashboard pagination)
  useEffect(() => {
    setLocalTotalLinks(totalLinks);
    setLinks(initialLinks);
  }, [initialLinks, totalLinks]);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderLimit, setFolderLimit] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');

  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [loadingFolder, setLoadingFolder] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleDrillDown = async (id: string | null) => {
    const existingItems = links.filter((l) => l.parent_id === id);
    setFolderLimit(Math.max(50, existingItems.length));
    setCurrentFolderId(id);

    if (id) {
      const currentItems = links.filter((l) => l.parent_id === id);
      if (currentItems.length === 0) {
        setLoadingFolder(id);
        const res = await loadMorePublicFolderLinks(profileId, id, 0, 50);
        if (res.links) {
          const newLinks = res.links.map((l) => ({
            ...l,
            is_active: !!l.is_active,
            is_folder: l.is_folder || false,
          }));
          setLinks((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = newLinks.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newOnes].sort(
              (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
            );
          });
          setFolderCounts((prev) => ({
            ...prev,
            [id]: res.totalFolderLinks ?? 0,
          }));
        }
        setLoadingFolder(null);
      }
    }
  };

  const handleLoadMoreFolder = async () => {
    if (!currentFolderId) return;
    setLoadingFolder(currentFolderId);

    const newLimit = folderLimit + 50;
    setFolderLimit(newLimit);

    const existingCount = links.filter(
      (l) => l.parent_id === currentFolderId,
    ).length;
    if (
      existingCount < newLimit &&
      existingCount < (folderCounts[currentFolderId] ?? 0)
    ) {
      const res = await loadMorePublicFolderLinks(
        profileId,
        currentFolderId,
        existingCount,
        50,
      );
      if (res.links) {
        const newLinks = res.links.map((l) => ({
          ...l,
          is_active: !!l.is_active,
          is_folder: l.is_folder || false,
        }));
        setLinks((prev) => {
          const newIds = new Set(newLinks.map((l) => l.id));
          const filteredPrev = prev.filter((p) => !newIds.has(p.id));
          return [...filteredPrev, ...newLinks].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          );
        });
      }
    }
    setLoadingFolder(null);
  };

  // Sync counts from server-side childCount if available
  useEffect(() => {
    const newCounts: Record<string, number> = { ...folderCounts };
    let changed = false;

    links.forEach((l) => {
      if (
        l.is_folder &&
        l.child_count !== undefined &&
        folderCounts[l.id] === undefined
      ) {
        newCounts[l.id] = l.child_count;
        changed = true;
      }
    });

    if (changed) {
      setFolderCounts(newCounts);
    }
  }, [links, folderCounts]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const rootCount = links.filter((l) => !l.parent_id).length;
      const result = await loadMorePublicLinks(profileId, rootCount, 50);
      if (result.error) {
        const { toast } = await import('react-toastify');
        toast.error('Failed to load more links.');
      } else if (result.links) {
        const newLinks = result.links.map((l) => ({
          ...l,
          is_active: !!l.is_active,
          is_folder: l.is_folder || false,
        }));
        setLinks((prev) => {
          const newIds = new Set(newLinks.map((l) => l.id));
          const filteredPrev = prev.filter((p) => !newIds.has(p.id));
          return [...filteredPrev, ...newLinks].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          );
        });
        if (newLinks.length >= 50) {
          setLocalTotalLinks((prev) => Math.max(prev, rootCount + newLinks.length + 1));
        } else {
          setLocalTotalLinks(rootCount + newLinks.length);
        }
      }
    } catch {
      const { toast } = await import('react-toastify');
      toast.error('Failed to load more links.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Determine which links to show
  const rawVisibleLinks = searchQuery
    ? activeLinks.filter(
        (l) =>
          !l.is_folder &&
          !l.is_header &&
          l.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : activeLinks.filter((l) =>
        currentFolderId ? l.parent_id === currentFolderId : !l.parent_id,
      );

  const visibleLinks = currentFolderId
    ? rawVisibleLinks.slice(0, folderLimit)
    : rawVisibleLinks;

  const currentFolder = currentFolderId
    ? activeLinks.find((l) => l.id === currentFolderId)
    : null;

  if (isLoading) {
    return (
      <div className='w-full space-y-4'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='w-full rounded-lg h-15' />
        ))}
      </div>
    );
  }

  return (
    <div className='w-full relative'>
      <div
        key={currentFolderId || 'root'}
        className='w-full space-y-4 animate-in fade-in duration-150'
      >
        {/* Header/Back Button */}
        {currentFolderId && currentFolder && !searchQuery && (
          <div className='flex items-center gap-2 mb-4'>
            <button
              onClick={() => handleDrillDown(null)}
              className='flex items-center justify-center p-2 rounded-xl backdrop-blur-sm transition-opacity hover:opacity-70 cursor-pointer'
              style={{
                backgroundColor: colors.elementBg,
                borderColor: colors.elementBorder,
                color: colors.textPrimary,
                borderWidth: '1px',
              }}
            >
              <LuArrowLeft className='w-5 h-5 mr-2' />
              <h2
                className='font-bold text-lg'
                style={{ color: colors.textPrimary }}
              >
                {currentFolder.title}
              </h2>
            </button>
          </div>
        )}

        {/* Search Bar */}
        {!currentFolderId && (
          <div className='sticky top-4 z-20 mb-6'>
            <div
              className='relative flex items-center w-full rounded-2xl backdrop-blur-md overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-primary/50'
              style={{
                backgroundColor: colors.elementBg,
                borderColor: colors.elementBorder,
                borderWidth: '1px',
              }}
            >
              <LuSearch
                className='absolute left-4 w-5 h-5 opacity-50'
                style={{ color: colors.textPrimary }}
              />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search links...'
                className='w-full py-4 pl-12 pr-12 bg-transparent outline-none placeholder:opacity-50'
                style={{ color: colors.textPrimary }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='absolute right-4 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all animate-in fade-in zoom-in-75 duration-150'
                  style={{ color: colors.textPrimary }}
                >
                  <LuX className='w-4 h-4' />
                </button>
              )}
            </div>
          </div>
        )}

          {loadingFolder &&
          loadingFolder === currentFolderId &&
          visibleLinks.length === 0 ? (
            <div className='w-full space-y-4 py-4'>
              {[1, 2].map((i) => (
                <Skeleton key={i} className='w-full rounded-lg h-15' />
              ))}
            </div>
          ) : activeLinks.length > 0 ? (
            visibleLinks.map((link, index) => {
              return (
                <div
                  key={link.id}
                  className='animate-in fade-in slide-in-from-bottom-4 duration-250 transition-all fill-mode-both w-full'
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  {link.is_header ? (
                    <div className="w-full py-3 flex items-center gap-3" style={{ color: colors.textPrimary }}>
                      <div className="h-px flex-1 bg-current opacity-20" />
                      <span className="text-sm font-semibold tracking-wide uppercase opacity-70">
                        {link.title}
                      </span>
                      <div className="h-px flex-1 bg-current opacity-20" />
                    </div>
                  ) : link.is_folder ? (
                    <button
                      onClick={() => handleDrillDown(link.id)}
                      className={cn(
                        buttonClasses,
                        'block w-full cursor-pointer isolate overflow-hidden',
                        link.animation_type === 'pulse' && 'animate-pulse',
                        link.animation_type === 'bounce' &&
                          'animate-subtle-bounce',
                        link.animation_type === 'glow' && 'animate-glow',
                      )}
                    >
                      <div className='flex items-center justify-center gap-3 w-full h-full'>
                        <LuFolderOpen className='w-5 h-5 shrink-0 opacity-80' />
                        <div className='flex flex-col items-center justify-center overflow-hidden'>
                          <span className='truncate text-center'>
                            {link.title}
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <LinkButton
                      href={`/${username}/${link.short_id ?? link.id}`}
                      title={link.title}
                      url={link.url}
                      subtitle={
                        searchQuery && link.parent_id ? (
                          <>
                            <LuFolderOpen className='w-3 h-3' />
                            {activeLinks.find((l) => l.id === link.parent_id)
                              ?.title || 'Folder'}
                          </>
                        ) : undefined
                      }
                      animationType={link.animation_type}
                      className={cn(buttonClasses, 'w-full')}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div
              className={cn(
                'text-center rounded-xl border border-dashed backdrop-blur-sm p-8',
                colors.elementBg,
                colors.elementBorder,
              )}
            >
              <p className={cn(colors.textSecondary, 'text-base')}>
                No links added yet
              </p>
            </div>
          )}
        </div>

      {!isLoading &&
        localTotalLinks > links.filter((l) => !l.parent_id).length &&
        !currentFolderId &&
        !searchQuery && (
          <div className='flex justify-center mt-6 w-full relative z-10'>
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className='px-6 py-2.5 rounded-full font-medium transition-all hover:opacity-80 disabled:opacity-50 text-sm shadow-sm hover:shadow active:scale-95 cursor-pointer disabled:cursor-not-allowed'
              style={{
                backgroundColor: colors.buttonBg,
                color: colors.buttonText,
                borderColor: colors.buttonBorder,
                borderWidth: '1px',
              }}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

      {!isLoading &&
        currentFolderId &&
        folderCounts[currentFolderId] !== undefined &&
        visibleLinks.length < folderCounts[currentFolderId] &&
        !searchQuery && (
          <div className='flex justify-center mt-6 w-full relative z-10'>
            <button
              onClick={handleLoadMoreFolder}
              disabled={loadingFolder === currentFolderId}
              className='px-6 py-2.5 rounded-full font-medium transition-all hover:opacity-80 active:scale-95 text-sm shadow-sm hover:shadow cursor-pointer disabled:cursor-not-allowed'
              style={{
                backgroundColor: colors.buttonBg,
                color: colors.buttonText,
                borderColor: colors.buttonBorder,
                borderWidth: '1px',
              }}
            >
              {loadingFolder === currentFolderId ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
    </div>
  );
}
