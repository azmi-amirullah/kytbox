import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import { getListById, getItemsByListId, WishlistDetail } from '@/features/list';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const list = await getListById(id);
  const title = list?.title ?? 'Wishlist';
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export default async function WishlistDetailPage({
  params,
}: Params) {
  const { id } = await params;
  const [{ profile }, list, items] = await Promise.all([
    getAuthenticatedUserAndProfile(),
    getListById(id),
    getItemsByListId(id),
  ]);

  if (!list || list.type !== 'wishlist') notFound();

  return (
    <div className='max-w-3xl mx-auto px-4 py-8 md:py-8 w-full'>
      <WishlistDetail
        list={list}
        initialItems={items}
        defaultCurrency={profile?.default_currency || DEFAULT_CURRENCY}
        username={profile?.username || ''}
      />
    </div>
  );
}
