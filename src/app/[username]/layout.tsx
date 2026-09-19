import React from 'react';
import { AudioProvider } from '@/features/bio/context/AudioContext';
import { BioAudioPlayer } from '@/features/bio/components/BioAudioPlayer';

export default function PublicProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AudioProvider>
      {children}
      <BioAudioPlayer />
    </AudioProvider>
  );
}
