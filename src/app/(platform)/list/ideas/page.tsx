import { getListsByType, getOrCreateNewIdeaList, getNewIdeaItems } from '../actions';
import TypeListGrid from '../components/TypeListGrid';
import NewIdeas from '../components/NewIdeas';

export default async function IdeasPage() {
  const [lists, newIdeaList, newIdeaItems] = await Promise.all([
    getListsByType('idea'),
    getOrCreateNewIdeaList(),
    getNewIdeaItems(),
  ]);

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full space-y-10'>
      <TypeListGrid lists={lists} type='idea' />

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
