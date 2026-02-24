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
import { reorderLinks, toggleLinkActive, deleteLink } from '../actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import MoveToFolderModal from './MoveToFolderModal';
import SortableLink from './SortableLink';
import type { Database } from '@/types/supabase';

type Link = Database['public']['Tables']['links']['Row'];

interface LinkListProps {
  links: Link[];
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  isLoading?: boolean;
  currentFolderId: string | null;
  onDrillDown: (folderId: string | null) => void;
}

export default function LinkList({
  links,
  setLinks,
  isLoading,
  currentFolderId,
  onDrillDown,
}: LinkListProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [linkToMove, setLinkToMove] = useState<Link | null>(null);

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
        <p className='text-sm'>Click &quot;Add Item&quot; to get started.</p>
      </div>
    );
  }

  // Filter links based on folder view
  const visibleLinks = links.filter((l) =>
    currentFolderId ? l.parent_id === currentFolderId : l.parent_id === null,
  );

  const folders = links.filter((l) => l.is_folder);
  const currentFolder = currentFolderId
    ? links.find((l) => l.id === currentFolderId)
    : null;

  return (
    <>
      {currentFolderId && currentFolder && (
        <div className='mb-4 pb-4 border-b border-border flex items-center gap-2 text-sm'>
          <button
            onClick={() => onDrillDown(null)}
            className='text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1 cursor-pointer'
          >
            ← Back to main list
          </button>
          <span className='text-muted-foreground'>/</span>
          <span className='font-semibold'>{currentFolder.title}</span>
        </div>
      )}

      {visibleLinks.length === 0 && (
        <div className='text-center py-12 text-muted-foreground'>
          <p>This folder is empty.</p>
          <p className='text-sm'>Move or add links here.</p>
        </div>
      )}

      {visibleLinks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleLinks.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-3'>
              {visibleLinks.map((link) => (
                <SortableLink
                  key={link.id}
                  link={link}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onMove={(id) =>
                    setLinkToMove(links.find((l) => l.id === id) || null)
                  }
                  onDrillDown={onDrillDown}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {linkToMove && (
        <MoveToFolderModal
          link={linkToMove}
          folders={folders}
          open={!!linkToMove}
          onOpenChange={(open) => !open && setLinkToMove(null)}
        />
      )}
    </>
  );
}
