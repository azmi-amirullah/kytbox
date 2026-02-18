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
import SortableLink from './SortableLink';
import { reorderLinks, toggleLinkActive, deleteLink } from '../actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import type { Database } from '@/types/supabase';

type Link = Database['public']['Tables']['links']['Row'];

interface LinkListProps {
  links: Link[];
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  isLoading?: boolean;
}

export default function LinkList({
  links,
  setLinks,
  isLoading,
}: LinkListProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Delay DndContext render to avoid hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((item) => item.id === active.id);
      const newIndex = links.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(links, oldIndex, newIndex);

      // Optimistic update for smooth DnD UX (acceptable trade-off)
      setLinks(newItems);
      reorderLinks(newItems.map((l) => l.id));
    }
  }

  async function handleToggle(linkId: string, isActive: boolean) {
    // Wait for DB success before updating UI
    const result = await toggleLinkActive(linkId, isActive);
    if (result?.error) {
      toast.error('Failed to update link status');
      return;
    }
    setLinks((items) =>
      items.map((item) =>
        item.id === linkId ? { ...item, is_active: isActive } : item,
      ),
    );
  }

  async function handleDelete(linkId: string) {
    // Wait for DB success before updating UI
    const result = await deleteLink(linkId);
    if (result?.error) {
      toast.error('Failed to delete link');
      return;
    }
    toast.success('Link deleted!');
    setLinks((items) => items.filter((item) => item.id !== linkId));
    router.refresh();
  }

  // Show skeleton during loading or SSR to avoid hydration mismatch
  if (isLoading || !mounted) {
    return (
      <div className='space-y-3'>
        {(isLoading ? [1, 2, 3] : links).map((_, i) => (
          <SortableLink.Skeleton key={i} />
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
