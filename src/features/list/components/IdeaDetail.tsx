'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { LuPlus, LuLightbulb } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ListDTO, ListItemDTO } from '@/types/dto';
import { addItem, reorderItems } from '../actions';
import IdeaItemRow from './IdeaItemRow';
import { toast } from 'react-toastify';
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

interface IdeaDetailProps {
  list: ListDTO;
  initialItems: ListItemDTO[];
}

export default function IdeaDetail({ list, initialItems }: IdeaDetailProps) {
  const [items, setItems] = useState(initialItems);
  const [newTitle, setNewTitle] = useState('');
  const [isPending, startTransition] = useTransition();

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

      const result = await reorderItems(list.id, reordered.map((item) => item.id));
      if (result.error) {
        toast.error(result.error);
        setItems(originalItems);
      }
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formData = new FormData();
    formData.set('listId', list.id);
    formData.set('title', newTitle);

    startTransition(async () => {
      const result = await addItem(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setItems((prev) => [...prev, result.data!]);
        setNewTitle('');
      }
    });
  };

  const handleItemUpdate = (updatedItem: ListItemDTO) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  const handleItemDelete = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  return (
    <div className='space-y-6'>
      {/* Breadcrumbs */}
      <nav aria-label='breadcrumb' className='flex items-center gap-1 text-sm text-muted-foreground'>
        <Link href='/app' className='hover:text-foreground transition-colors'>
          Kytbox
        </Link>
        <span className='text-muted-foreground'>/</span>
        <Link href='/list' className='hover:text-foreground transition-colors'>
          List
        </Link>
        <span className='text-muted-foreground'>/</span>
        <Link href='/list/ideas' className='hover:text-foreground transition-colors'>
          Ideas
        </Link>
        <span className='text-muted-foreground'>/</span>
        <span aria-current='page' className='text-foreground font-medium truncate max-w-[200px]'>
          {list.title}
        </span>
      </nav>

      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>{list.title}</h1>
        {list.description && (
          <p className='text-sm text-muted-foreground mt-1'>{list.description}</p>
        )}
      </div>

      {/* Add idea form */}
      <form onSubmit={handleAddItem} className='flex gap-2'>
        <Input
          placeholder='Add an idea...'
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={300}
          className='flex-1'
        />
        <Button
          type='submit'
          disabled={isPending || !newTitle.trim()}
          size='icon'
          aria-label='Add idea'
        >
          <LuPlus className='w-4 h-4' />
        </Button>
      </form>

      {/* Items */}
      {items.length === 0 ? (
        <div className='flex flex-col items-center justify-center min-h-[200px] bg-card border border-dashed rounded-2xl p-8 text-center'>
          <LuLightbulb className='w-10 h-10 text-muted-foreground/40 mb-3' />
          <p className='text-muted-foreground text-sm'>
            No ideas yet. Type above and press Enter to capture one.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-2'>
              {items.map((item) => (
                <IdeaItemRow
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdate}
                  onDelete={handleItemDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
