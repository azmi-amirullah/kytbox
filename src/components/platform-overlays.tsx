'use client';

import { CommandPalette } from '@/components/command-palette';
import { OnboardingTour } from '@/components/onboarding-tour';
import { WhatsNewModal } from '@/features/platform';

interface PlatformOverlaysProps {
  hasCompletedOnboarding?: boolean | null;
}

export function PlatformOverlays({ hasCompletedOnboarding }: PlatformOverlaysProps) {
  return (
    <>
      <CommandPalette />
      <OnboardingTour hasCompletedOnboarding={Boolean(hasCompletedOnboarding)} />
      <WhatsNewModal hasCompletedOnboarding={Boolean(hasCompletedOnboarding)} />
    </>
  );
}
