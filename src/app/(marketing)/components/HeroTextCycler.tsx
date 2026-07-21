'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHRASES = [
  'Share your links',
  'Track your money',
  'Organize your ideas',
];

export function HeroTextCycler() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className='relative inline-grid items-center justify-center overflow-hidden h-[1.5em] py-0.5 align-middle'>
      {/* Invisible sizers — each phrase occupies a grid cell so the container */}
      {/* stretches to the widest phrase. Only the active phrase is visible.   */}
      {PHRASES.map((phrase) => (
        <span
          key={phrase}
          aria-hidden
          className='invisible col-start-1 row-start-1 text-primary pointer-events-none select-none'
        >
          {phrase}
        </span>
      ))}

      <AnimatePresence mode='wait'>
        <motion.span
          key={PHRASES[index]}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className='col-start-1 row-start-1 text-primary flex items-center justify-center'
        >
          {PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

