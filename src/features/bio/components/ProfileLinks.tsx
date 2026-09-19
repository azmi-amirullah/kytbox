'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LinkButton } from './LinkButton';
import type { ThemeConfig } from '@/lib/theme/theme.types';
import { LuArrowLeft, LuFolderOpen, LuSearch, LuX, LuPlay, LuPause, LuMusic, LuLoader } from 'react-icons/lu';
import { loadMorePublicLinks, loadMorePublicFolderLinks } from '../actions';
import { getEmbedInfo, isAudioUrl } from '../embed';
import SensitiveOverlay from './SensitiveOverlay';
import { useAudio } from '../context/AudioContext';
import { Button } from '@/components/ui/button';

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
    display_mode?: string | null;
    icon_url?: string | null;
    child_count?: number;
    scheduled_at?: string | null;
    expires_at?: string | null;
    is_pinned?: boolean;
    is_sensitive?: boolean;
    grid_size?: string | null;
    stream_url?: string | null;
    audio_artist?: string | null;
    audio_cover_url?: string | null;
  }[];
  username: string;
  profileId: string;
  totalLinks?: number;
  theme: ThemeConfig;
  buttonClasses: string;
  isLoading?: boolean;
  isInteractive?: boolean;
}

export default function ProfileLinks({
  links: initialLinks,
  username,
  profileId,
  totalLinks = 0,
  theme,
  buttonClasses,
  isLoading,
  isInteractive = true,
}: ProfileLinksProps) {
  const { colors } = theme;
  const audio = useAudio();
  const [isMounted, setIsMounted] = useState(false);
  const [links, setLinks] = useState(initialLinks);
  const [localTotalLinks, setLocalTotalLinks] = useState(totalLinks);

  useEffect(() => {
    setIsMounted(true);
  }, []);
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

  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderLimit, setFolderLimit] = useState(50);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

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
    for (const l of links) {
      if (l.is_folder && typeof l.child_count === 'number') {
        if (newCounts[l.id] !== l.child_count) {
          newCounts[l.id] = l.child_count;
          changed = true;
        }
      }
    }
    if (changed) {
      setFolderCounts(newCounts);
    }
  }, [links, folderCounts]);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const rootLinksCount = links.filter((l) => !l.parent_id).length;
      const res = await loadMorePublicLinks(profileId, rootLinksCount, 50);

      if (res.links && res.links.length > 0) {
        const newLinks = res.links.map((l) => ({
          ...l,
          is_active: !!l.is_active,
          is_folder: l.is_folder || false,
        }));

        setLinks((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const filteredNew = newLinks.filter((m) => !existingIds.has(m.id));
          return [...prev, ...filteredNew].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          );
        });

        if (newLinks.length >= 50) {
          setLocalTotalLinks((prev) => Math.max(prev, rootLinksCount + newLinks.length + 1));
        } else {
          setLocalTotalLinks(rootLinksCount + newLinks.length);
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter links by search query if present, otherwise show root or folder items
  const query = searchQuery.toLowerCase().trim();
  const rawVisibleLinks = query
    ? activeLinks.filter(
        (l) =>
          !l.is_folder &&
          (l.title?.toLowerCase().includes(query) ||
            l.url?.toLowerCase().includes(query)),
      )
    : activeLinks.filter((l) =>
        currentFolderId ? l.parent_id === currentFolderId : !l.parent_id,
      );

  // Stable: pinned links float to top (server already orders them first,
  // but client-side sort ensures correctness after load-more merges)
  const sortedVisibleLinks = [...rawVisibleLinks].sort((a, b) => {
    const aPinned = a.is_pinned ? 1 : 0;
    const bPinned = b.is_pinned ? 1 : 0;
    return bPinned - aPinned;
  });

  const visibleLinks = currentFolderId
    ? sortedVisibleLinks.slice(0, folderLimit)
    : sortedVisibleLinks;

  const currentFolder = currentFolderId
    ? activeLinks.find((l) => l.id === currentFolderId)
    : null;

  if (isLoading) {
    return (
      <div className='w-full space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='w-full rounded-lg h-15 bg-muted/40 animate-pulse' />
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
          <div className='w-full mb-6'>
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
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  onClick={() => setSearchQuery('')}
                  aria-label='Clear search'
                  className='absolute right-2'
                >
                  <LuX className='w-4 h-4' />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Bento Grid Canvas */}
        <div className='grid grid-cols-2 gap-3 sm:gap-4 grid-flow-dense @container w-full'>
          {loadingFolder &&
          loadingFolder === currentFolderId &&
          visibleLinks.length === 0 ? (
            <div className='col-span-2 w-full space-y-4 py-4'>
              {[1, 2].map((i) => (
                <div key={i} className='w-full rounded-lg h-15 bg-muted/40 animate-pulse' />
              ))}
            </div>
          ) : activeLinks.length > 0 ? (
            visibleLinks.map((link, index) => {
              const isHeader = !!link.is_header;
              const embed = getEmbedInfo(link.url);
              const isEmbed = !isHeader && !link.is_folder && link.display_mode === 'embed' && !!embed;
              const hasAudioStream = isAudioUrl(link.url) || (!!link.stream_url && link.stream_url.trim().length > 0);
              const safeGridSize: '1x1' | '2x2' | 'full' =
                link.grid_size === '1x1' || link.grid_size === '2x2'
                  ? link.grid_size
                  : 'full';

              const spanClasses = isHeader || isEmbed
                ? 'col-span-2'
                : safeGridSize === '1x1'
                ? 'col-span-1 row-span-1'
                : safeGridSize === '2x2'
                ? 'col-span-2 sm:row-span-2'
                : 'col-span-2';

              const roundedClasses = buttonClasses
                .split(' ')
                .filter((c) => c.startsWith('rounded-'));
              const shapeClass =
                roundedClasses.length > 0
                  ? roundedClasses.join(' ')
                  : 'rounded-xl';

              return (
                <div
                  key={link.id}
                  className={cn(
                    'animate-in fade-in slide-in-from-bottom-4 duration-250 transition-all fill-mode-both w-full',
                    spanClasses,
                  )}
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  {isHeader ? (
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
                        safeGridSize === '1x1' && 'min-h-27.5 p-3',
                        link.animation_type === 'pulse' && 'animate-pulse',
                        link.animation_type === 'bounce' &&
                          'animate-subtle-bounce',
                        link.animation_type === 'glow' && 'animate-glow',
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center gap-3 w-full h-full',
                        safeGridSize === '1x1' && 'flex-col gap-1.5 text-center',
                      )}>
                        <LuFolderOpen className='w-5 h-5 shrink-0 opacity-80' />
                        <div className='flex flex-col items-center justify-center overflow-hidden'>
                          <span className='truncate text-center text-sm font-medium'>
                            {link.title}
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : hasAudioStream ? (() => {
                    const isCurrentAudio = audio?.currentTrack?.id === link.id;
                    const isAudioPlaying = isCurrentAudio && !!audio?.isPlaying;
                    const isAudioLoading = isCurrentAudio && !!audio?.isLoading;
                    const showLoader = !isMounted || isAudioLoading;

                    const handleAudioToggle = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isMounted || !isInteractive || !audio) return;
                      if (isCurrentAudio) {
                        audio.togglePlay();
                      } else {
                        audio.playTrack({
                          id: link.id,
                          title: link.title,
                          artist: link.audio_artist,
                          streamUrl: (link.url && isAudioUrl(link.url)) ? link.url : (link.stream_url ?? link.url ?? ''),
                          coverUrl: link.audio_cover_url || link.icon_url,
                        });
                      }
                    };

                    const audioTile = safeGridSize === '1x1' ? (
                      <button
                        type='button'
                        onClick={handleAudioToggle}
                        disabled={!isMounted || !isInteractive}
                        aria-busy={showLoader}
                        className={cn(
                          buttonClasses,
                          'relative flex flex-col justify-between p-3.5 h-full min-h-30 w-full isolate overflow-hidden cursor-pointer text-left transition-all active:scale-98',
                          !isMounted && 'opacity-80 cursor-wait',
                        )}
                      >
                        <div className='flex items-center justify-between w-full'>
                          <div className='p-1.5 rounded-lg bg-primary/10 text-primary'>
                            <LuMusic className='w-4 h-4' />
                          </div>
                          <span
                            aria-hidden='true'
                            className='w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform active:scale-90'
                          >
                            {showLoader ? (
                              <LuLoader className='w-3.5 h-3.5 animate-spin' />
                            ) : isAudioPlaying ? (
                              <LuPause className='w-3.5 h-3.5' />
                            ) : (
                              <LuPlay className='w-3.5 h-3.5 ml-0.5' />
                            )}
                          </span>
                        </div>
                        <div className='w-full overflow-hidden'>
                          <p className='text-xs font-semibold truncate leading-tight'>{link.title}</p>
                          {link.audio_artist && (
                            <p className='text-[10px] opacity-70 truncate mt-0.5'>{link.audio_artist}</p>
                          )}
                        </div>
                      </button>
                    ) : safeGridSize === '2x2' ? (
                      <button
                        type='button'
                        onClick={handleAudioToggle}
                        disabled={!isMounted || !isInteractive}
                        aria-busy={showLoader}
                        className={cn(
                          buttonClasses,
                          'relative flex flex-col justify-between p-5 h-full min-h-55 w-full isolate overflow-hidden cursor-pointer text-left transition-all active:scale-98',
                          !isMounted && 'opacity-80 cursor-wait',
                        )}
                      >
                        <div className='flex items-start justify-between w-full gap-3'>
                          {link.audio_cover_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={link.audio_cover_url}
                              alt=''
                              className='w-14 h-14 rounded-xl object-cover shadow-sm shrink-0'
                            />
                          ) : (
                            <div className='w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs'>
                              <LuMusic className='w-7 h-7' />
                            </div>
                          )}
                          <span
                            aria-hidden='true'
                            className='w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95'
                          >
                            {showLoader ? (
                              <LuLoader className='w-5 h-5 animate-spin' />
                            ) : isAudioPlaying ? (
                              <LuPause className='w-5 h-5' />
                            ) : (
                              <LuPlay className='w-5 h-5 ml-0.5' />
                            )}
                          </span>
                        </div>
                        <div className='space-y-1.5 mt-4'>
                          <div className='flex items-center gap-1.5 text-[11px] text-primary font-medium tracking-wide uppercase'>
                            <span className={cn('w-2 h-2 rounded-full', isAudioLoading ? 'bg-amber-500 animate-pulse' : isAudioPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-primary/50')} />
                            <span>{isAudioLoading ? 'Loading Audio...' : isAudioPlaying ? 'Now Playing' : 'Audio Stream'}</span>
                          </div>
                          <h3 className='text-base font-bold line-clamp-2 leading-snug'>{link.title}</h3>
                          {link.audio_artist && (
                            <p className='text-xs opacity-75 line-clamp-1'>{link.audio_artist}</p>
                          )}
                        </div>
                      </button>
                    ) : (
                      <button
                        type='button'
                        onClick={handleAudioToggle}
                        disabled={!isMounted || !isInteractive}
                        aria-busy={showLoader}
                        className={cn(
                          buttonClasses,
                          'relative flex items-center justify-between p-3.5 sm:p-4 w-full isolate overflow-hidden cursor-pointer text-left gap-3 transition-all active:scale-99',
                          !isMounted && 'opacity-80 cursor-wait',
                        )}
                      >
                        <div className='flex items-center gap-3 min-w-0 flex-1'>
                          {link.audio_cover_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={link.audio_cover_url}
                              alt=''
                              className='w-10 h-10 rounded-lg object-cover shadow-xs shrink-0'
                            />
                          ) : (
                            <div className='w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                              <LuMusic className='w-5 h-5' />
                            </div>
                          )}
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <h4 className='text-sm font-semibold truncate'>{link.title}</h4>
                              {isAudioPlaying && (
                                <span className='flex h-2 w-2 relative shrink-0'>
                                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                                  <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
                                </span>
                              )}
                              {isAudioLoading && (
                                <span className='text-[10px] text-amber-500 font-medium animate-pulse shrink-0'>
                                  Loading...
                                </span>
                              )}
                            </div>
                            {link.audio_artist && (
                              <p className='text-xs opacity-75 truncate'>{link.audio_artist}</p>
                            )}
                          </div>
                        </div>
                        <span
                          aria-hidden='true'
                          className='w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0 transition-transform active:scale-95'
                        >
                          {showLoader ? (
                            <LuLoader className='w-4 h-4 animate-spin' />
                          ) : isAudioPlaying ? (
                            <LuPause className='w-4 h-4' />
                          ) : (
                            <LuPlay className='w-4 h-4 ml-0.5' />
                          )}
                        </span>
                      </button>
                    );

                    return link.is_sensitive ? (
                      <SensitiveOverlay
                        theme={theme}
                        isInteractive={isInteractive}
                        className={shapeClass}
                      >
                        {audioTile}
                      </SensitiveOverlay>
                    ) : (
                      audioTile
                    );
                  })() : (() => {
                    if (embed && isEmbed) {
                      const embedEl = (
                        <div
                          className='w-full rounded-xl overflow-hidden shadow-sm border transition-all'
                          style={{
                            borderColor: colors.elementBorder,
                            backgroundColor: colors.elementBg,
                          }}
                        >
                          <iframe
                            src={embed.embedUrl}
                            width='100%'
                            height={embed.type === 'youtube' ? undefined : '80'}
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope'
                            allowFullScreen={embed.type === 'youtube'}
                            className={cn(
                              'border-0 block w-full',
                              embed.type === 'youtube' && 'aspect-video h-auto',
                              !isInteractive && 'pointer-events-none',
                            )}
                            loading='lazy'
                            title={link.title}
                          />
                        </div>
                      );
                      return link.is_sensitive ? (
                        <SensitiveOverlay
                          theme={theme}
                          isInteractive={isInteractive}
                          className='rounded-xl'
                        >
                          {embedEl}
                        </SensitiveOverlay>
                      ) : (
                        embedEl
                      );
                    }
                    const linkEl = (
                      <LinkButton
                        href={`/${username}/${link.short_id ?? link.id}`}
                        title={link.title}
                        url={link.url}
                        iconUrl={link.icon_url}
                        gridSize={safeGridSize}
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
                    );

                    return link.is_sensitive ? (
                      <SensitiveOverlay
                        theme={theme}
                        isInteractive={isInteractive}
                        className={shapeClass}
                      >
                        {linkEl}
                      </SensitiveOverlay>
                    ) : (
                      linkEl
                    );
                  })()}
                </div>
              );
            })
          ) : (
            <div
              className={cn(
                'col-span-2 text-center rounded-xl border border-dashed backdrop-blur-sm p-8',
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
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              loading={isLoadingMore}
              className='px-6 py-2.5 rounded-full font-medium transition-all hover:opacity-80 disabled:opacity-50 text-sm shadow-sm hover:shadow active:scale-95'
              style={{
                backgroundColor: colors.buttonBg,
                color: colors.buttonText,
                borderColor: colors.buttonBorder,
                borderWidth: '1px',
              }}
            >
              Load More
            </Button>
          </div>
        )}

      {!isLoading &&
        currentFolderId &&
        folderCounts[currentFolderId] !== undefined &&
        visibleLinks.length < folderCounts[currentFolderId] &&
        !searchQuery && (
          <div className='flex justify-center mt-6 w-full relative z-10'>
            <Button
              onClick={handleLoadMoreFolder}
              disabled={loadingFolder === currentFolderId}
              loading={loadingFolder === currentFolderId}
              className='px-6 py-2.5 rounded-full font-medium transition-all hover:opacity-80 active:scale-95 text-sm shadow-sm hover:shadow'
              style={{
                backgroundColor: colors.buttonBg,
                color: colors.buttonText,
                borderColor: colors.buttonBorder,
                borderWidth: '1px',
              }}
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
