import { notFound } from 'next/navigation';
import { getListById, getItemsByListId } from '../../actions';
import { getColumnsByListId } from '../../column-actions';
import KanbanBoard from '../../components/KanbanBoard';

export default async function KanbanBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
