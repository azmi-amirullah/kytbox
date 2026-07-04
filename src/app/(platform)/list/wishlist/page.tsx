import { getListsByType } from '../actions';
import TypeListGrid from '../components/TypeListGrid';

export default async function WishlistPage() {
  const lists = await getListsByType('wishlist');

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <TypeListGrid lists={lists} type='wishlist' />
    </div>
  );
}
