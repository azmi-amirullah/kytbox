import { getListCounts } from './actions';
import ListHub from './components/ListHub';

export default async function ListPage() {
  const counts = await getListCounts();

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <ListHub counts={counts} />
    </div>
  );
}
