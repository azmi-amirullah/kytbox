'use client';

import Image from 'next/image';

interface PhonePreviewProps {
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
  links: {
    id: string;
    title: string;
    url: string;
    is_active: boolean;
  }[];
}

export default function PhonePreview({ profile, links }: PhonePreviewProps) {
  // Filter only active links for the preview, just like real page
  const activeLinks = links.filter((l) => l.is_active);

  return (
    <div className='relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-14 rounded-[2.5rem] h-[600px] w-[300px] shadow-xl'>
      {/* Phone Notch/Camera */}
      <div className='w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-2xl left-1/2 -translate-x-1/2 absolute z-20'></div>

      {/* Side Buttons */}
      <div className='h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg'></div>
      <div className='h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg'></div>
      <div className='h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg'></div>

      {/* Screen Content - Mimicking the public page structure */}
      <div className='overflow-hidden rounded-4xl h-full w-full bg-background scrollbar-hide'>
        <div className='h-full overflow-y-auto px-4 py-12 scrollbar-hide'>
          {/* Profile Header */}
          <div className='text-center mb-6'>
            {profile.avatar_url ? (
              <div className='relative w-20 h-20 mx-auto mb-3'>
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  fill
                  className='rounded-full object-cover border-2 border-border'
                />
              </div>
            ) : (
              <div className='w-20 h-20 rounded-full mx-auto mb-3 bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-border'>
                {(profile.display_name || profile.username)
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <h1 className='text-xl font-bold text-foreground'>
              {profile.display_name || profile.username}
            </h1>
            {profile.bio && (
              <p className='text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto'>
                {profile.bio}
              </p>
            )}
          </div>

          {/* Links */}
          <div className='space-y-3'>
            {activeLinks.length > 0 ? (
              activeLinks.map((link) => (
                <div
                  key={link.id}
                  className='
                    block w-full p-3 rounded-lg text-center
                    bg-card border border-border
                    text-card-foreground text-sm font-medium
                    shadow-sm
                  '
                >
                  {link.title}
                </div>
              ))
            ) : (
              <p className='text-center text-xs text-muted-foreground'>
                No visible links
              </p>
            )}
          </div>

          {/* Footer */}
          <div className='mt-8 text-center text-muted-foreground text-[10px]'>
            <p>Powered by Link-Base</p>
          </div>
        </div>
      </div>
    </div>
  );
}
