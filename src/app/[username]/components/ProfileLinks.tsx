'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LinkButton } from './LinkButton';
import type { ThemeConfig } from '@/lib/theme/theme.types';
import { AnimatePresence, motion } from 'framer-motion';
import { LuArrowLeft, LuFolderOpen, LuSearch, LuX } from 'react-icons/lu';
import { loadMorePublicLinks, loadMorePublicFolderLinks } from '../actions';
import { toast } from 'react-toastify';

interface ProfileLinksProps {
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
    short_id?: string | number | null;
    is_folder?: boolean;
    parent_id?: string | null;
    sort_order?: number | null;
    animation_type?: string | null;
    child_count?: number;
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
  const activeLinks = links.filter((l) => l.is_active);

  // Sync state if initialLinks prop changes (e.g. from server-side navigation or dashboard pagination)
  useEffect(() => {
    setLocalTotalLinks(totalLinks);
    if (initialLinks.length > 0) {
      setLinks(initialLinks);
    }
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
      }
    } catch {
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

  // Animation variants
  const variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'tween' as const,
        ease: 'easeOut' as const,
        duration: 0.1,
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      transition: {
        type: 'tween' as const,
        ease: 'easeIn' as const,
        duration: 0.1,
      },
    }),
  };

  if (isLoading) {
    return (
      <div className='w-full space-y-4'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='w-full rounded-lg h-[60px]' />
        ))}
      </div>
    );
  }

  // Direction: 1 for going deeper, -1 for going back
  const direction = currentFolderId ? 1 : -1;

  return (
    <div className='w-full relative'>
      <AnimatePresence initial={false} mode='wait' custom={direction}>
        <motion.div
          key={currentFolderId || 'root'}
          custom={direction}
          variants={variants}
          initial='initial'
          animate='animate'
          exit='exit'
          className='w-full space-y-4'
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
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery('')}
                      className='absolute right-4 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors'
                      style={{ color: colors.textPrimary }}
                    >
                      <LuX className='w-4 h-4' />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {loadingFolder &&
          loadingFolder === currentFolderId &&
          visibleLinks.length === 0 ? (
            <div className='w-full space-y-4 py-4'>
              {[1, 2].map((i) => (
                <Skeleton key={i} className='w-full rounded-lg h-[60px]' />
              ))}
            </div>
          ) : activeLinks.length > 0 ? (
            visibleLinks.map((link, index) => {
              return (
                <div
                  key={link.id}
                  className='animate-in fade-in slide-in-from-bottom-4 duration-250 transition-all fill-mode-both'
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  {link.is_folder ? (
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
        </motion.div>
      </AnimatePresence>

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
