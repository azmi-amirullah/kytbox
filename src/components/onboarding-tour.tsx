'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu';
import { completeOnboardingAction } from '@/app/(platform)/app/actions';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-apps-grid',
    title: 'Welcome to Kytbox! 🎉',
    description: 'This is your workspace dashboard. Each app below is built to optimize different aspects of your digital life—links, finances, and organization.',
  },
  {
    targetId: 'tour-app-bio',
    title: 'Link-in-Bio Manager 🔗',
    description: 'Create responsive, visually stunning landing pages with nested folders, rich animations, dividers, and live time-based link scheduling.',
  },
  {
    targetId: 'tour-app-cashflow',
    title: 'Smart Cashflow Tracker 💰',
    description: 'Gain control over your finances with dynamic projections, recurring transactions, category filtering, and budget thresholds.',
  },
  {
    targetId: 'tour-app-list',
    title: 'Omni Lists & Kanban 📋',
    description: 'Organize tasks, wishlists, and ideas with drag-and-drop boards, price-tracking wishlists, and lightning-fast brain dumps.',
  },
  {
    targetId: 'tour-search-trigger',
    title: 'Universal Command Palette ⌘K',
    description: 'Navigate the entire platform, search files, execute quick actions, and toggle visual modes in milliseconds. Press Cmd+K or Ctrl+K anytime.',
  },
];

interface OnboardingTourProps {
  hasCompletedOnboarding: boolean;
}

export function OnboardingTour({ hasCompletedOnboarding }: OnboardingTourProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Only show on /app if onboarding is not completed
  useEffect(() => {
    if (pathname === '/app' && !hasCompletedOnboarding) {
      // Small timeout to let the page settle before starting tour
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pathname, hasCompletedOnboarding]);

  const measureElement = useCallback(() => {
    const currentStep = TOUR_STEPS[stepIndex];
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setCoords(null);
    }
  }, [stepIndex]);

  // Handle element scrolling and measuring on step change
  useEffect(() => {
    if (!isVisible) return;

    const currentStep = TOUR_STEPS[stepIndex];
    const el = document.getElementById(currentStep.targetId);
    
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const timeout = setTimeout(() => {
      measureElement();
    }, 350);

    window.addEventListener('resize', measureElement);
    window.addEventListener('scroll', measureElement, { passive: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', measureElement);
      window.removeEventListener('scroll', measureElement);
    };
  }, [stepIndex, isVisible, measureElement]);

  const handleSkip = useCallback(async () => {
    setIsVisible(false);
    try {
      await completeOnboardingAction();
    } catch (err) {
      console.error('Failed to update onboarding state:', err);
    }
  }, []);

  const handleComplete = useCallback(async () => {
    setIsVisible(false);
    try {
      await completeOnboardingAction();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [stepIndex, handleComplete]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  }, [stepIndex]);

  // Focus trap and keyboard controls
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      tooltipRef.current.focus();
    }
  }, [stepIndex, isVisible]);

  // Global keydown handler to prevent interactive div requirements and type assertions
  useEffect(() => {
    if (!isVisible) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
        return;
      }

      if (e.key === 'Tab') {
        if (!tooltipRef.current) return;
        const focusable = tooltipRef.current.querySelectorAll(
          'button, [tabindex="0"]'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (first instanceof HTMLElement && last instanceof HTMLElement) {
          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isVisible, handleSkip]);

  // Calculate dynamic style on the fly during render
  const getTooltipStyle = (): React.CSSProperties => {
    if (!isVisible) return { opacity: 0 };
    if (!coords) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '420px',
        opacity: 1,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      };
    }

    if (typeof window === 'undefined') return { opacity: 0 };

    const padding = 8;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const tooltipWidth = Math.min(420, screenWidth - 32);

    if (screenWidth < 640) {
      return {
        position: 'fixed',
        bottom: '24px',
        left: '16px',
        right: '16px',
        width: 'calc(100% - 32px)',
        opacity: 1,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      };
    }

    const targetBottom = coords.y + coords.height + padding;
    const targetTop = coords.y - padding;
    const targetCenterX = coords.x + coords.width / 2;

    let top = 0;
    let left = targetCenterX - tooltipWidth / 2;

    const estimatedTooltipHeight = 180;
    if (targetBottom + estimatedTooltipHeight + 20 < screenHeight) {
      top = targetBottom + 12;
    } else {
      top = targetTop - estimatedTooltipHeight - 12;
    }

    left = Math.max(16, Math.min(left, screenWidth - tooltipWidth - 16));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      opacity: 1,
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    };
  };

  if (!isVisible) return null;

  const currentStep = TOUR_STEPS[stepIndex];
  const padding = 8;
  const tooltipStyle = getTooltipStyle();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden select-none">
        {/* SVG Spotlight Overlay */}
        <svg className="fixed inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="onboarding-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {coords && (
                <motion.rect
                  animate={{
                    x: coords.x - padding,
                    y: coords.y - padding,
                    width: coords.width + padding * 2,
                    height: coords.height + padding * 2,
                  }}
                  transition={{ type: 'spring', stiffness: 150, damping: 22 }}
                  rx={16}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          {/* Dark masked background covering the page */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#onboarding-spotlight-mask)"
            className="pointer-events-auto cursor-default"
          />
        </svg>

        {/* Tooltip Dialog Card */}
        <div
          ref={tooltipRef}
          tabIndex={-1}
          style={tooltipStyle}
          className="bg-card border border-border shadow-2xl rounded-2xl p-6 pointer-events-auto flex flex-col focus:outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-dialog-title"
          aria-describedby="tour-dialog-desc"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 
              id="tour-dialog-title" 
              className="text-lg font-bold text-card-foreground tracking-tight"
            >
              {currentStep.title}
            </h3>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/80 p-1.5 rounded-lg transition-colors cursor-pointer"
              aria-label="Skip onboarding tour"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p 
            id="tour-dialog-desc" 
            className="text-sm text-muted-foreground leading-relaxed mb-6"
          >
            {currentStep.description}
          </p>

          {/* Footer Controls */}
          <div className="flex items-center justify-between mt-auto">
            {/* Step Dots Indicator */}
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/35'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-all cursor-pointer"
                >
                  <LuChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer"
              >
                {stepIndex === TOUR_STEPS.length - 1 ? (
                  'Get Started'
                ) : (
                  <>
                    Next
                    <LuChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
