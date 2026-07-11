import { notFound } from 'next/navigation';
import { getListById, getItemsByListId, WishlistDetail } from '@/features/list';

export default async function WishlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [list, items] = await Promise.all([
    getListById(id),
    getItemsByListId(id),
  ]);

  if (!list || list.type !== 'wishlist') notFound();

  return (
    <div className='max-w-3xl mx-auto px-4 py-8 md:py-8 w-full'>
      <WishlistDetail list={list} initialItems={items} />
    </div>
  );
}
