'use client';

import ProfileView from '@/app/[username]/components/ProfileView';
import type { CustomThemeData } from '@/lib/theme/theme.types';

interface PhonePreviewProps {
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
  }[];
  isLoading?: boolean;
}

export default function PhonePreview({
  profile,
  links,
  isLoading,
}: PhonePreviewProps) {
  // Use 85% scale as requested
  const scale = 0.85;
  const baseWidth = 414;
  const baseHeight = 868;
  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;

  return (
    <div
      className='relative mx-auto group overflow-visible select-none'
      style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
    >
      {/* Scaling Container - Matches visual center */}
      <div
        className='origin-top transform transition-transform duration-500'
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `scale(${scale})`,
          marginLeft: `-${(baseWidth - scaledWidth) / 2}px`, // Offset the scale-from-center visually
        }}
      >
        {/* Phone Frame */}
        <div className='relative w-full h-full bg-neutral-900 rounded-[56px] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-12 border-neutral-900 ring-1 ring-white/10 ring-inset'>
          {/* Inner Screen */}
          <div className='relative rounded-[44px] overflow-hidden overflow-y-auto scrollbar-hide w-full h-full'>
            <ProfileView
              profile={profile}
              links={links}
              isLoading={isLoading}
            />

            {!isLoading && (
              <div className='absolute inset-0 z-50 pointer-events-auto bg-transparent cursor-default' />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
