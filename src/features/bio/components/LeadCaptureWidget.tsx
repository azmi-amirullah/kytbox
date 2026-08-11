'use client';

import { useState } from 'react';
import { LuMail, LuCheck, LuLoader, LuArrowRight } from 'react-icons/lu';
import { subscribeToBioAction } from '../actions';
import { cn } from '@/lib/utils';
import type { ThemeConfig } from '@/lib/theme/theme.types';

interface LeadCaptureWidgetProps {
  profileId: string;
  theme?: ThemeConfig;
  className?: string;
  isInteractive?: boolean;
}

export default function LeadCaptureWidget({
  profileId,
  theme,
  className,
  isInteractive = true,
}: LeadCaptureWidgetProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting || !isInteractive) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const sourceUrl = typeof window !== 'undefined' ? window.location.href : undefined;
      const res = await subscribeToBioAction(profileId, email.trim(), sourceUrl);

      if (res.success) {
        setSuccessMessage(res.message || 'Successfully subscribed!');
        setEmail('');
      } else {
        setErrorMessage(res.error || 'Failed to subscribe. Please try again.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = theme?.colors;

  return (
    <div
      className={cn(
        'w-full my-6 p-5 sm:p-6 rounded-2xl backdrop-blur-md transition-all shadow-sm',
        className,
      )}
      style={
        colors
          ? {
              backgroundColor: colors.elementBg,
              borderColor: colors.elementBorder,
              borderWidth: '1px',
            }
          : undefined
      }
    >
      <div className='flex items-center gap-3 mb-4'>
        <div
          className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm'
          style={
            colors
              ? {
                  backgroundColor: colors.buttonBg,
                  color: colors.buttonText,
                }
              : undefined
          }
        >
          <LuMail className='w-4 h-4' />
        </div>
        <div>
          <h4
            className='font-bold text-sm sm:text-base tracking-tight'
            style={colors ? { color: colors.textPrimary } : undefined}
          >
            Join my newsletter
          </h4>
          <p
            className='text-xs opacity-80 mt-0.5'
            style={colors ? { color: colors.textSecondary } : undefined}
          >
            Get updates, exclusive content, and news directly in your inbox.
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className='flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium animate-in fade-in zoom-in-95 duration-200'>
          <LuCheck className='w-4 h-4 shrink-0' />
          <span>{successMessage}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-2.5'>
          <div className='relative flex-1 min-w-0'>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email address'
              disabled={isSubmitting || !isInteractive}
              readOnly={!isInteractive}
              tabIndex={isInteractive ? 0 : -1}
              className='w-full h-11 px-4 text-xs sm:text-sm rounded-xl border bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:opacity-50 disabled:cursor-default disabled:pointer-events-none'
              style={
                colors
                  ? {
                      color: colors.textPrimary,
                      borderColor: colors.elementBorder,
                    }
                  : undefined
              }
            />
          </div>
          <button
            type='submit'
            disabled={isSubmitting || !email.trim() || !isInteractive}
            tabIndex={isInteractive ? 0 : -1}
            className='h-11 px-5 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none hover:opacity-90'
            style={
              colors
                ? {
                    backgroundColor: colors.buttonBg,
                    color: colors.buttonText,
                    borderColor: colors.buttonBorder,
                    borderWidth: '1px',
                  }
                : undefined
            }
          >
            {isSubmitting ? (
              <LuLoader className='w-4 h-4 animate-spin' />
            ) : (
              <>
                <span>Subscribe</span>
                <LuArrowRight className='w-4 h-4' />
              </>
            )}
          </button>
        </form>
      )}

      {errorMessage && (
        <p className='mt-2.5 text-xs text-destructive font-medium animate-in fade-in duration-200'>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
