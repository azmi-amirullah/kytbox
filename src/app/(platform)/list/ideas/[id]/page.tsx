import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getListById, getItemsByListId, IdeaDetail } from '@/features/list';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const list = await getListById(id);
  const title = list?.title ?? 'Ideas';
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export default async function IdeaDetailPage({
  params,
}: Params) {
  const { id } = await params;
  const [list, items] = await Promise.all([
    getListById(id),
    getItemsByListId(id),
  ]);

  if (!list || list.type !== 'idea') notFound();

  if (list.title === '__new_idea__') {
    redirect('/list/ideas');
  }

  return (
    <div className='max-w-3xl mx-auto px-4 py-8 md:py-8 w-full'>
      <IdeaDetail list={list} initialItems={items} />
    </div>
  );
}
