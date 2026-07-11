import { getListsByType, TypeListGrid } from '@/features/list';

export default async function TodoPage() {
  const lists = await getListsByType('todo');

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <TypeListGrid lists={lists} type='todo' />
    </div>
  );
}
