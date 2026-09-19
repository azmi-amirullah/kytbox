import {
  getListsByType,
  getOrCreateNewIdeaList,
  getItemsByListId,
  TypeListGrid,
  NewIdeas,
} from '@/features/list';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';

export default async function IdeasPage() {
  const [{ profile }, lists, newIdeaList] = await Promise.all([
    getAuthenticatedUserAndProfile(),
    getListsByType('idea'),
    getOrCreateNewIdeaList(),
  ]);

  const newIdeaItems = newIdeaList ? await getItemsByListId(newIdeaList.id) : [];

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full space-y-10'>
      <TypeListGrid
        lists={lists}
        type='idea'
        username={profile?.username || ''}
      />

      {newIdeaList && (
        <NewIdeas
          newIdeaList={newIdeaList}
          initialItems={newIdeaItems}
          ideaLists={lists}
        />
      )}
    </div>
  );
}
