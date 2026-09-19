import { getListsByType, TypeListGrid } from '@/features/list';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';

export default async function WishlistPage() {
  const [{ profile }, lists] = await Promise.all([
    getAuthenticatedUserAndProfile(),
    getListsByType('wishlist'),
  ]);

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <TypeListGrid
        lists={lists}
        type='wishlist'
        username={profile?.username || ''}
      />
    </div>
  );
}
