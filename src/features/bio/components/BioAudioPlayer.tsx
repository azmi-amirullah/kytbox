'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuPlay, LuPause, LuX, LuMusic, LuLoader } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { useAudio } from '../context/AudioContext';

export function BioAudioPlayer() {
  const audio = useAudio();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (!audio) return;
    audio.pauseTrack();
    setIsClosing(true);
  }, [audio]);

  // closePlayer() is deferred until after the exit animation completes so
  // AnimatePresence can keep the exiting child mounted with track data intact.
  const handleExitComplete = useCallback(() => {
    audio?.closePlayer();
    setIsClosing(false);
  }, [audio]);

  const track = audio?.currentTrack ?? null;
  const isVisible = !isClosing && !!track;

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && track && audio ? (
        <motion.div
          key='bio-audio-player'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className='fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl p-3 flex flex-col gap-2'
        >
          <div className='flex items-center gap-3'>
            {/* Cover Art / Icon */}
            <div className='relative w-11 h-11 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center border border-border/60'>
              {track.coverUrl ? (
                // External cover URLs are dynamic user content and not hosted on internal domain
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className='w-full h-full object-cover'
                />
              ) : (
                <LuMusic className='w-5 h-5 text-primary' />
              )}
            </div>

            {/* Track Details */}
            <div className='flex-1 min-w-0 pr-1'>
              <span className='block text-xs font-semibold text-foreground truncate'>
                {track.title}
              </span>
              <span className='block text-[11px] text-muted-foreground truncate'>
                {track.artist || 'Audio Track'}
              </span>
            </div>

            {/* Controls */}
            <div className='flex items-center gap-1.5 shrink-0'>
              <Button
                onClick={audio.togglePlay}
                type='button'
                size='icon'
                aria-label={audio.isPlaying ? 'Pause' : 'Play'}
                className='rounded-full shadow-xs'
              >
                {audio.isLoading ? (
                  <LuLoader className='w-4 h-4 animate-spin' />
                ) : audio.isPlaying ? (
                  <LuPause className='w-4 h-4 fill-current' />
                ) : (
                  <LuPlay className='w-4 h-4 fill-current ml-0.5' />
                )}
              </Button>

              <Button
                onClick={handleClose}
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='Close player'
                className='rounded-full text-muted-foreground'
              >
                <LuX className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* Progress Bar & Time */}
          <ProgressBar
            progress={audio.progress}
            currentTime={audio.currentTime}
            duration={audio.duration}
            seek={audio.seek}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProgressBar({
  progress,
  currentTime,
  duration,
  seek,
}: {
  progress: number;
  currentTime: number;
  duration: number;
  seek: (p: number) => void;
}) {
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    seek(Math.max(0, Math.min(1, clickX / rect.width)));
  };

  return (
    <div className='space-y-1 pt-1'>
      <div
        role='slider'
        aria-label='Seek audio position'
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            seek(Math.min(1, progress + 0.05));
          } else if (e.key === 'ArrowLeft') {
            seek(Math.max(0, progress - 0.05));
          }
        }}
        className='relative w-full h-1.5 bg-muted rounded-full cursor-pointer overflow-hidden group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary'
      >
        <div
          className='absolute left-0 top-0 bottom-0 bg-primary rounded-full transition-all duration-100'
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className='flex items-center justify-between text-[10px] text-muted-foreground font-mono'>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
