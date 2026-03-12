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
import { reorderLinks, toggleLinkActive, deleteLink, loadFolderLinks } from '../actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { LuFolderOpen, LuLoader } from 'react-icons/lu';
import MoveToFolderModal from './MoveToFolderModal';
import SortableLink from './SortableLink';
import type { LinkDTO } from '@/types/dto';
import { rawLinkListSchema } from '@/lib/validation.schemas.client';

interface LinkListProps {
  links: LinkDTO[];
  setLinks: React.Dispatch<React.SetStateAction<LinkDTO[]>>;
  isLoading?: boolean;
  currentFolderId: string | null;
  onDrillDown: (folderId: string | null) => void;
  folderCounts: Record<string, number>;
  setFolderCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onRefreshView: (refreshRoot?: boolean) => Promise<void>;
  setLocalActiveLinks: React.Dispatch<React.SetStateAction<number>>;
}

export default function LinkList({
  links,
  setLinks,
  isLoading,
  currentFolderId,
  onDrillDown,
  folderCounts,
  setFolderCounts,
  onRefreshView,
  setLocalActiveLinks,
}: LinkListProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [linkToMove, setLinkToMove] = useState<LinkDTO | null>(null);
  const [folderLimit, setFolderLimit] = useState(50);
  const [loadingFolder, setLoadingFolder] = useState<string | null>(null);

  // Expand limit logic: if user adds a link locally, we should show it
  useEffect(() => {
    if (currentFolderId) {
      const itemsInFolder = links.filter((l) => l.parent_id === currentFolderId);
      setFolderLimit((prev) => Math.max(prev, itemsInFolder.length, 50));
    }
  }, [links, currentFolderId]);

  const handleDrillDown = async (id: string | null) => {
    const existingItems = links.filter((l) => l.parent_id === id);
    setFolderLimit(Math.max(50, existingItems.length));
    onDrillDown(id);
    if (id) {
      const currentItems = links.filter((l) => l.parent_id === id);
      if (currentItems.length === 0) {
        setLoadingFolder(id);
        const res = await loadFolderLinks(id, 0, 50);
        if ('links' in res && res.links) {
          const rawLinks = rawLinkListSchema.parse(res.links);
          const mappedLinks: LinkDTO[] = rawLinks.map((l) => ({
            id: l.id,
            title: l.title,
            url: l.url || '',
            sort_order: l.sort_order,
            is_active: l.is_active,
            clicks: l.clicks,
            is_folder: l.is_folder,
            parent_id: l.parent_id,
            animation_type: l.animation_type,
            child_count: l.children?.[0]?.count ?? l.child_count ?? 0,
          }));
          setLinks((prev) => {
            const serverIds = new Set(mappedLinks.map((m) => m.id));
            const filteredPrev = prev.filter((p) => !serverIds.has(p.id));
            return [...filteredPrev, ...mappedLinks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          });
          if ('totalCount' in res) {
            setFolderCounts((prev) => ({ ...prev, [id]: res.totalCount ?? 0 }));
          }
        }
        setLoadingFolder(null);
      }
    }
  };

  const handleLoadMoreFolder = async () => {
    if (!currentFolderId || loadingFolder) return;
    
    // 1. Calculate new display window
    const newLimit = folderLimit + 50;
    setFolderLimit(newLimit);

    // 2. Decide if we need to fetch more data from server
    const folderLinks = links.filter((l) => l.parent_id === currentFolderId);
    const existingRealItems = folderLinks.filter((l) => !l.is_local).length;
    const totalServerExpected = folderCounts[currentFolderId] ?? 0;

    if (existingRealItems >= totalServerExpected) {
      return;
    }

    // 3. Perform fetch
    setLoadingFolder(currentFolderId);
    try {
      const res = await loadFolderLinks(currentFolderId, existingRealItems, 50);
      if ('links' in res && res.links) {
        const rawLinks = rawLinkListSchema.parse(res.links);
        const mappedLinks: LinkDTO[] = rawLinks.map((l) => ({
          id: l.id,
          title: l.title,
          url: l.url || '',
          sort_order: l.sort_order,
          is_active: l.is_active,
          clicks: l.clicks,
          is_folder: l.is_folder,
          parent_id: l.parent_id,
          animation_type: l.animation_type,
          child_count: l.children?.[0]?.count ?? l.child_count ?? 0,
        }));

        if ('totalCount' in res && res.totalCount !== undefined) {
          setFolderCounts((prev) => ({
            ...prev,
            [currentFolderId]: res.totalCount!,
          }));
        }

        setLinks((prev) => {
          const serverIds = new Set(mappedLinks.map((m) => m.id));
          const filteredPrev = prev.filter((p) => !serverIds.has(p.id));
          return [...filteredPrev, ...mappedLinks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        });
      }
    } finally {
      setLoadingFolder(null);
    }
  };

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
      // 1. Identify all links belonging to the current parent (even those beyond the pagination limit)
      const currentSegment = links.filter((l) =>
        currentFolderId ? l.parent_id === currentFolderId : l.parent_id === null,
      );
      
      const oldIndex = currentSegment.findIndex((item) => item.id === active.id);
      const newIndex = currentSegment.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // 2. Reorder only this segment
        const reorderedSegment = arrayMove(currentSegment, oldIndex, newIndex).map((l, idx) => ({
          ...l,
          sort_order: idx, // Update local sort_order for consistent rendering
        }));

        // 3. Keep links from other parents/folders
        const others = links.filter((l) =>
          currentFolderId ? l.parent_id !== currentFolderId : l.parent_id !== null,
        );

        // 4. Update state with the merged list
        const nextLinks = [...others, ...reorderedSegment].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        
        setLinks(nextLinks);
        
        // 5. Sync with server
        reorderLinks(reorderedSegment.map((l) => l.id));
      }
    }
  }

  async function handleToggle(linkId: string, isActive: boolean) {
    const link = links.find(l => l.id === linkId);
    if (!link) return;

    const result = await toggleLinkActive(linkId, isActive);
    if (result?.error) {
      toast.error('Failed to update link status');
      return;
    }
    
    // Update locally for instant response
    setLinks((items) =>
      items.map((item) =>
        item.id === linkId ? { ...item, is_active: isActive } : item,
      ),
    );

    if (link.is_folder) {
      // Re-fetch ground truth for hierarchical counts
      await onRefreshView();
    } else {
      setLocalActiveLinks((prev) => (isActive ? prev + 1 : prev - 1));
    }
  }

  async function handleDelete(linkId: string) {
    const result = await deleteLink(linkId);
    if (result?.error) {
      toast.error('Failed to delete link');
      return;
    }
    toast.success('Link deleted!');
    
    // Refresh ground-truth from server
    await onRefreshView();
    router.refresh();
  }

  async function handleUpdate() {
    // Refresh ground-truth from server
    await onRefreshView();
    router.refresh();
  }

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

  const rawVisibleLinks = links.filter((l) =>
    currentFolderId ? l.parent_id === currentFolderId : l.parent_id === null,
  );
  
  const visibleLinks = currentFolderId ? rawVisibleLinks.slice(0, folderLimit) : rawVisibleLinks;

  const folders = links.filter((l) => l.is_folder);
  const currentFolder = currentFolderId
    ? links.find((l) => l.id === currentFolderId)
    : null;

  return (
    <>
      {currentFolderId && (
        <div className='mb-4 pb-4 border-b border-border flex items-center gap-2 text-sm'>
          <button
            onClick={() => handleDrillDown(null)}
            className='text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1 cursor-pointer'
          >
            ← Back to main list
          </button>
          <span className='text-muted-foreground'>/</span>
          <span className='font-semibold'>{currentFolder?.title || 'Folder'}</span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {visibleLinks.length === 0 && !loadingFolder ? (
          <div className='text-center py-12 px-6 rounded-xl border-2 border-dashed border-border/50 bg-muted/30 backdrop-blur-sm'>
            <div className='bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border'>
              <LuFolderOpen className='w-6 h-6 text-muted-foreground' />
            </div>
            <p className='text-foreground font-medium'>This folder is empty</p>
            <p className='text-sm text-muted-foreground max-w-[200px] mx-auto mt-1'>
              Move or add links here to get started.
            </p>
          </div>
        ) : (
          <SortableContext
            items={visibleLinks.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-3'>
              {visibleLinks.map((link) => (
                <SortableLink
                   key={link.id}
                   link={link}
                   childCount={link.is_folder ? (folderCounts[link.id] ?? 0) : undefined}
                   isParentHidden={currentFolder ? !currentFolder.is_active : false}
                   onToggle={handleToggle}
                   onDelete={handleDelete}
                   onMove={(id) =>
                     setLinkToMove(links.find((l) => l.id === id) || null)
                   }
                   onDrillDown={handleDrillDown}
                   onUpdate={handleUpdate}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </DndContext>

      {linkToMove && (
        <MoveToFolderModal
          link={linkToMove}
          folders={folders}
          open={!!linkToMove}
          onOpenChange={(open) => !open && setLinkToMove(null)}
          onSuccess={async (newParentId) => {
             // If moved to root (parentId is null), refresh the root view
             await onRefreshView(!newParentId);
             router.refresh();
          }}
        />
       )}

      {currentFolderId && folderCounts[currentFolderId] !== undefined && (visibleLinks.length < folderCounts[currentFolderId] || loadingFolder === currentFolderId) && (
        <div className='mt-8 flex justify-center pb-6'>
          <Button
            variant='outline'
            onClick={handleLoadMoreFolder}
            disabled={loadingFolder === currentFolderId}
            className='min-w-[140px] shadow-sm'
          >
            {loadingFolder === currentFolderId ? (
              <>
                <LuLoader className='w-4 h-4 mr-2 animate-spin' />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </>
  );
}
