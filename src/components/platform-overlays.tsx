'use client';

import { CommandPalette } from '@/components/command-palette';
import { OnboardingTour } from '@/components/onboarding-tour';
import { WhatsNewModal } from '@/features/platform';
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts-modal';

interface PlatformOverlaysProps {
  hasCompletedOnboarding?: boolean | null;
}

export function PlatformOverlays({ hasCompletedOnboarding }: PlatformOverlaysProps) {
  return (
    <>
      <CommandPalette />
      <KeyboardShortcutsModal />
      <OnboardingTour hasCompletedOnboarding={Boolean(hasCompletedOnboarding)} />
      <WhatsNewModal hasCompletedOnboarding={Boolean(hasCompletedOnboarding)} />
    </>
  );
}
