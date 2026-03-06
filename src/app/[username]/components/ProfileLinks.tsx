'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LinkButton } from './LinkButton';
import type { ThemeConfig } from '@/lib/theme/theme.types';
import { AnimatePresence, motion } from 'framer-motion';
import { LuArrowLeft, LuFolderOpen, LuSearch, LuX } from 'react-icons/lu';

interface ProfileLinksProps {
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
    short_id?: string | number | null;
    is_folder?: boolean;
    parent_id?: string | null;
    animation_type?: string | null;
  }[];
  username: string;
  theme: ThemeConfig;
  buttonClasses: string;
  isLoading?: boolean;
}

export default function ProfileLinks({
  links,
  username,
  theme,
  buttonClasses,
  isLoading,
}: ProfileLinksProps) {
  const { colors } = theme;
  const activeLinks = links.filter((l) => l.is_active);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine which links to show
  const visibleLinks = searchQuery
    ? activeLinks.filter(
        (l) =>
          !l.is_folder &&
          l.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : activeLinks.filter((l) =>
        currentFolderId ? l.parent_id === currentFolderId : !l.parent_id,
      );

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
                onClick={() => setCurrentFolderId(null)}
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

          {activeLinks.length > 0 ? (
            visibleLinks.map((link, index) => {
              return (
                <div
                  key={link.id}
                  className='animate-in fade-in slide-in-from-bottom-4 duration-250 transition-all fill-mode-both'
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  {link.is_folder ? (
                    <button
                      onClick={() => setCurrentFolderId(link.id)}
                      className={cn(
                        buttonClasses,
                        'w-full flex items-center justify-center gap-3 cursor-pointer',
                      )}
                    >
                      <LuFolderOpen className='w-5 h-5 opacity-80' />
                      <span>{link.title}</span>
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
    </div>
  );
}
