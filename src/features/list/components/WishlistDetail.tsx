'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LuPlus, LuHeart } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import type { ListDTO, ListItemDTO } from '@/types/dto';
import WishlistItemRow from './WishlistItemRow';
import AddWishlistItemModal from './AddWishlistItemModal';
import { wishlistMetadataClientSchema } from '../schemas.client';


interface WishlistDetailProps {
  list: ListDTO;
  initialItems: ListItemDTO[];
}

export default function WishlistDetail({
  list,
  initialItems,
}: WishlistDetailProps) {
  const [items, setItems] = useState(initialItems);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleItemAdded = (newItem: ListItemDTO) => {
    setItems((prev) => [...prev, newItem]);
  };

  const handleItemUpdate = (updatedItem: ListItemDTO) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  const handleItemDelete = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Calculate total remaining (unpurchased items)
  const totalRemaining = items
    .filter((item) => !item.is_completed)
    .reduce((sum, item) => {
      const { price } = wishlistMetadataClientSchema.parse(item.metadata);
      return sum + (price ?? 0);
    }, 0);

  const currency = String(
    items
      .map((item) => wishlistMetadataClientSchema.parse(item.metadata).currency)
      .find(Boolean) || 'USD'
  );

  const purchasedCount = items.filter((i) => i.is_completed).length;

  return (
    <div className='space-y-6'>
      {/* Breadcrumbs */}
      <nav className='flex items-center gap-1 text-sm text-muted-foreground'>
        <Link href='/app' className='hover:text-foreground transition-colors'>
          Kytbox
        </Link>
        <span className='text-muted-foreground'>/</span>
        <Link href='/list' className='hover:text-foreground transition-colors'>
          List
        </Link>
        <span className='text-muted-foreground'>/</span>
        <Link href='/list/wishlist' className='hover:text-foreground transition-colors'>
          Wishlist
        </Link>
        <span className='text-muted-foreground'>/</span>
        <span className='text-foreground font-medium truncate max-w-[200px]'>
          {list.title}
        </span>
      </nav>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{list.title}</h1>
          {list.description && (
            <p className='text-sm text-muted-foreground mt-1'>
              {list.description}
            </p>
          )}
        </div>
        <Button onClick={() => setIsAddOpen(true)} className='gap-2 shrink-0'>
          <LuPlus className='w-4 h-4' />
          Add Wish
        </Button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className='flex flex-col items-center justify-center min-h-[200px] bg-card border border-dashed rounded-2xl p-8 text-center'>
          <LuHeart className='w-10 h-10 text-muted-foreground/40 mb-3' />
          <p className='text-muted-foreground text-sm'>
            No wishes yet. Add something you want!
          </p>
          <Button
            onClick={() => setIsAddOpen(true)}
            variant='outline'
            className='mt-4 gap-2'
          >
            <LuPlus className='w-4 h-4' />
            Add Wish
          </Button>
        </div>
      ) : (
        <div className='space-y-2'>
          {items.map((item) => (
            <WishlistItemRow
              key={item.id}
              item={item}
              onUpdate={handleItemUpdate}
              onDelete={handleItemDelete}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className='bg-card border rounded-xl p-4 flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            {purchasedCount}/{items.length} purchased
          </div>
          {totalRemaining > 0 && (
            <div className='text-sm font-semibold'>
              Remaining:{' '}
              <span className='text-primary'>
                {currency} {totalRemaining.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      <AddWishlistItemModal
        listId={list.id}
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
}
