import { getListsByType, TypeListGrid } from '@/features/list';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';

export default async function TodoPage() {
  const [{ profile }, lists] = await Promise.all([
    getAuthenticatedUserAndProfile(),
    getListsByType('todo'),
  ]);

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <TypeListGrid
        lists={lists}
        type='todo'
        username={profile?.username || ''}
      />
    </div>
  );
}
