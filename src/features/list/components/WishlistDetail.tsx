'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  LuPlus,
  LuHeart,
  LuEllipsisVertical,
  LuGlobe,
  LuLock,
  LuCopy,
  LuExternalLink,
  LuPencil,
  LuTrash2,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ListDTO, ListItemDTO } from '@/types/dto';
import WishlistItemRow from './WishlistItemRow';
import AddWishlistItemModal from './AddWishlistItemModal';
import EditListModal from './EditListModal';
import DeleteListDialog from './DeleteListDialog';
import { wishlistMetadataClientSchema } from '../schemas.client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { reorderItems, toggleListPublic } from '../actions';
import { toast } from 'react-toastify';

interface WishlistDetailProps {
  list: ListDTO;
  initialItems: ListItemDTO[];
  defaultCurrency?: string;
  username?: string;
}

export default function WishlistDetail({
  list,
  initialItems,
  defaultCurrency = 'USD',
  username = '',
}: WishlistDetailProps) {
  const router = useRouter();
  const [currentList, setCurrentList] = useState(list);
  const [items, setItems] = useState(initialItems);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTogglingPublic, startToggleTransition] = useTransition();

  const [prevListId, setPrevListId] = useState(list.id);
  if (list.id !== prevListId) {
    setPrevListId(list.id);
    setCurrentList(list);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const originalItems = [...items];
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);

      const result = await reorderItems(currentList.id, reordered.map((item) => item.id));
      if (result.error) {
        toast.error(result.error);
        setItems(originalItems);
      }
    }
  };

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

  const handleTogglePublic = () => {
    startToggleTransition(async () => {
      const nextPublic = !currentList.is_public;
      const result = await toggleListPublic(currentList.id, nextPublic);
      if (result.error) {
        toast.error(result.error);
      } else {
        setCurrentList((prev) => ({
          ...prev,
          is_public: nextPublic,
          ...(result.slug ? { slug: result.slug } : {}),
        }));
        toast.success(
          nextPublic ? 'Wishlist is now public' : 'Wishlist is now private',
        );
      }
    });
  };

  const handleCopyPublicLink = async () => {
    const slug = currentList.slug || currentList.id;
    const path = `/${username}/list/${slug}`;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public link copied to clipboard');
    } catch {
      toast.error('Failed to copy public link');
    }
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
      .find(Boolean) || defaultCurrency || 'USD'
  );

  const purchasedCount = items.filter((i) => i.is_completed).length;

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='space-y-1.5 sm:space-y-2'>
        <BreadcrumbNav title={currentList.title} />

        {/* Header */}
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-baseline gap-1.5 flex-wrap min-w-0'>
              <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground wrap-break-word'>
                {currentList.title}
              </h1>

              {/* 3-Dot Options Menu right beside title */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 rounded-full shrink-0 cursor-pointer text-muted-foreground hover:text-foreground self-baseline translate-y-0.5'
                    aria-label='Wishlist options'
                    disabled={isTogglingPublic}
                  >
                    <LuEllipsisVertical className='w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-48'>
                  <DropdownMenuItem
                    className='cursor-pointer'
                    onClick={handleTogglePublic}
                    disabled={isTogglingPublic}
                  >
                    {currentList.is_public ? (
                      <>
                        <LuLock className='w-4 h-4 mr-2' />
                        Make Private
                      </>
                    ) : (
                      <>
                        <LuGlobe className='w-4 h-4 mr-2' />
                        Make Public
                      </>
                    )}
                  </DropdownMenuItem>

                  {currentList.is_public && Boolean(username) && (
                    <>
                      <DropdownMenuItem
                        className='cursor-pointer'
                        onClick={handleCopyPublicLink}
                      >
                        <LuCopy className='w-4 h-4 mr-2' />
                        Copy Public Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='cursor-pointer'
                        onClick={() =>
                          window.open(
                            `/${username}/list/${currentList.slug || currentList.id}`,
                            '_blank',
                          )
                        }
                      >
                        <LuExternalLink className='w-4 h-4 mr-2' />
                        View Public Page
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className='cursor-pointer'
                    onClick={() => setIsEditOpen(true)}
                  >
                    <LuPencil className='w-4 h-4 mr-2' />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='cursor-pointer text-destructive focus:text-destructive'
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <LuTrash2 className='w-4 h-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {currentList.is_public && (
                <span className='inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-center'>
                  <LuGlobe className='w-3 h-3' />
                  Public
                </span>
              )}
            </div>
            {currentList.description && (
              <p className='text-sm text-muted-foreground mt-1'>
                {currentList.description}
              </p>
            )}
          </div>
          <Button onClick={() => setIsAddOpen(true)} className='gap-2 shrink-0'>
            <LuPlus className='w-4 h-4' />
            Add Wish
          </Button>
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className='flex flex-col items-center justify-center min-h-50 bg-card border border-dashed rounded-2xl p-8 text-center'>
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
        <DndContext
          id={`wishlist-detail-${currentList.id}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              role='list'
              aria-label='Wishlist items'
              className='space-y-2'
            >
              {items.map((item) => (
                <WishlistItemRow
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdate}
                  onDelete={handleItemDelete}
                  defaultCurrency={defaultCurrency}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
        listId={currentList.id}
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onItemAdded={handleItemAdded}
        defaultCurrency={defaultCurrency}
      />

      <EditListModal
        list={currentList}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onListUpdated={(updated) =>
          setCurrentList((prev) => ({
            ...prev,
            title: updated.title,
            description: updated.description,
          }))
        }
      />

      <DeleteListDialog
        list={currentList}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onDeleted={() => router.push('/list/wishlist')}
      />
    </div>
  );
}
