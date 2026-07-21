'use client';

import dynamic from 'next/dynamic';

const CommandPalette = dynamic(
  () => import('@/components/command-palette').then((mod) => mod.CommandPalette),
  { ssr: false }
);

const OnboardingTour = dynamic(
  () => import('@/components/onboarding-tour').then((mod) => mod.OnboardingTour),
  { ssr: false }
);

interface PlatformOverlaysProps {
  hasCompletedOnboarding?: boolean | null;
}

export function PlatformOverlays({ hasCompletedOnboarding }: PlatformOverlaysProps) {
  return (
    <>
      <CommandPalette />
      <OnboardingTour hasCompletedOnboarding={Boolean(hasCompletedOnboarding)} />
    </>
  );
}
