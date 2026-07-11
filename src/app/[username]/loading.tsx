import { ProfileView } from '@/features/bio';

export default function Loading() {
  return (
    <div className='min-h-screen w-full bg-[#fcfaf2]'>
      <ProfileView
        isLoading={true}
        profile={{
          id: '',
          username: '',
          display_name: null,
          avatar_url: null,
          bio: null,
          theme_name: 'default',
          button_style: 'default',
          button_shape: 'rounded',
          social_links: null,
        }}
        links={[]}
      />
    </div>
  );
}
