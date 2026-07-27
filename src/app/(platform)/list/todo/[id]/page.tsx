import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getListById, getItemsByListId, getColumnsByListId, KanbanBoard } from '@/features/list';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const list = await getListById(id);
  const title = list?.title ?? 'Board';
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export default async function KanbanBoardPage({
  params,
}: Params) {
  const { id } = await params;
  const [list, columns, items] = await Promise.all([
    getListById(id),
    getColumnsByListId(id),
    getItemsByListId(id),
  ]);

  if (!list || list.type !== 'todo') notFound();

  return (
    <div className='max-w-full mx-auto px-4 py-8 md:py-8 w-full'>
      <KanbanBoard list={list} initialColumns={columns} initialItems={items} />
    </div>
  );
}
