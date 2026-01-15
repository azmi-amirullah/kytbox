'use client';

import { useState, useEffect } from 'react';
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableLink from '@/app/dashboard/components/SortableLink';
import { reorderLinks, toggleLinkActive, deleteLink } from '../actions';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/supabase';

type Link = Database['public']['Tables']['links']['Row'];

interface LinkListProps {
  links: Link[];
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;
}

export default function LinkList({ links, setLinks }: LinkListProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Delay DndContext render to avoid hydration mismatch
  // Delay DndContext render to avoid hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((item) => item.id === active.id);
      const newIndex = links.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(links, oldIndex, newIndex);

      setLinks(newItems);
      // Persist order to Supabase (Fire and forget)
      reorderLinks(newItems.map((l) => l.id));
    }
  }

  async function handleToggle(linkId: string, isActive: boolean) {
    setLinks((items) =>
      items.map((item) =>
        item.id === linkId ? { ...item, is_active: isActive } : item
      )
    );
    await toggleLinkActive(linkId, isActive);
  }

  async function handleDelete(linkId: string) {
    setLinks((items) => items.filter((item) => item.id !== linkId));
    await deleteLink(linkId);
    router.refresh();
  }

  // Show placeholder during SSR to avoid hydration mismatch with DndContext IDs
  if (!mounted) {
    return (
      <div className='space-y-3'>
        {links.map((link) => (
          <div
            key={link.id}
            className='flex items-center gap-4 p-4 rounded-lg border bg-card border-border animate-pulse'
          >
            <div className='w-5 h-5 bg-muted rounded' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 bg-muted rounded w-1/3' />
              <div className='h-3 bg-muted rounded w-1/2' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        <p>No links yet.</p>
        <p className='text-sm'>Click &quot;Add Link&quot; to get started.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={links.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className='space-y-3'>
          {links.map((link) => (
            <SortableLink
              key={link.id}
              link={link}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
