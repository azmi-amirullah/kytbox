'use client';

import { CommandPalette } from '@/components/command-palette';
import { OnboardingTour } from '@/components/onboarding-tour';

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
