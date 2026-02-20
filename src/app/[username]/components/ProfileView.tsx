'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  getTheme,
  getButtonClasses,
  validateButtonStyle,
  validateButtonShape,
  getContainerClasses,
  normalizeHex,
} from '@/lib/theme';
import type { CustomThemeData } from '@/lib/theme/theme.types';
import SocialGrid from '@/app/(platform)/bio/components/SocialGrid';
import ProfileHeader from './ProfileHeader';
import ProfileLinks from './ProfileLinks';

interface ProfileViewProps {
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    theme_name?: string | null;
    custom_theme?: CustomThemeData | null;
    button_style?: string | null;
    button_shape?: string | null;
    social_links?: Record<string, string> | null;
  };
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
    short_id?: string | number | null;
  }[];
  isLoading?: boolean;
}

export default function ProfileView({
  profile,
  links,
  isLoading,
}: ProfileViewProps) {
  const theme = getTheme(profile?.theme_name, profile?.custom_theme);
  const buttonStyle = validateButtonStyle(profile?.button_style);
  const buttonShape = validateButtonShape(profile?.button_shape);

  const { colors } = theme;
  const buttonClasses = getButtonClasses(theme, buttonStyle, buttonShape);

  // Hydration guard is only needed for the dashboard preview or specific charts.
  // We keep it for safety but remove it as a source of truth for the profile skeleton to prevent "Double Flashes".
  const showSkeleton = isLoading;

  return (
    <div
      className={cn(
        'flex-1 min-h-full w-full selection:bg-primary/10 selection:text-primary transition-colors duration-500',
        getContainerClasses(theme),
      )}
      style={
        theme.id === 'custom' && profile.custom_theme
          ? ({
              '--custom-bg': normalizeHex(profile.custom_theme.background),
              '--custom-text-primary': normalizeHex(
                profile.custom_theme.textPrimary,
              ),
              '--custom-text-secondary': normalizeHex(
                profile.custom_theme.textSecondary,
              ),
              '--custom-element-bg': normalizeHex(
                profile.custom_theme.elementBg,
              ),
              '--custom-element-border': normalizeHex(
                profile.custom_theme.elementBorder,
              ),
              '--custom-element-ring': normalizeHex(
                profile.custom_theme.elementRing,
              ),
              '--custom-button-bg': normalizeHex(profile.custom_theme.buttonBg),
              '--custom-button-border': normalizeHex(
                profile.custom_theme.buttonBorder,
              ),
              '--custom-button-text': normalizeHex(
                profile.custom_theme.buttonText,
              ),
              '--custom-footer-bg': normalizeHex(profile.custom_theme.footerBg),
              '--custom-footer-border': normalizeHex(
                profile.custom_theme.footerBorder,
              ),
              '--custom-footer-text': normalizeHex(
                profile.custom_theme.footerText,
              ),
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className='flex flex-col items-center min-h-full w-full max-w-[680px] mx-auto px-4 pt-16 pb-12 '>
        {/* Header (Avatar, Name, Bio) */}
        <ProfileHeader
          profile={profile}
          theme={theme}
          isLoading={showSkeleton}
        />

        {/* Social Grid */}
        <div className='flex justify-center w-full mb-12'>
          <SocialGrid
            socialLinks={(profile.social_links as Record<string, string>) || {}}
            theme={theme}
            className='justify-center'
            isLoading={showSkeleton}
          />
        </div>

        {/* Links List */}
        <ProfileLinks
          links={links}
          username={profile.username}
          theme={theme}
          buttonClasses={buttonClasses}
          isLoading={showSkeleton}
        />

        {/* Branding Footer */}
        <div className='mt-auto flex flex-col items-center pt-16'>
          <Link
            href='/'
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all shadow-sm hover:scale-105 active:scale-95',
              colors.footerBg,
              colors.footerBorder,
              colors.footerText,
            )}
          >
            <span className='text-xs font-bold tracking-wider'>Powered by</span>
            <span
              className={cn(
                'text-xs font-black tracking-wider',
                colors.footerBrandText,
              )}
            >
              Kytbox
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
