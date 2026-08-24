'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ListDTO, ListType } from '@/types/dto';
import ListCard from './ListCard';
import CreateListModal from './CreateListModal';
import TemplatePickerModal from './TemplatePickerModal';
import { Button } from '@/components/ui/button';
import { LuPlus, LuLayoutGrid, LuHeart, LuLightbulb } from 'react-icons/lu';

interface TypeListGridProps {
  lists: ListDTO[];
  type: ListType;
}

const TYPE_META: Record<
  ListType,
  {
    label: string;
    singular: string;
    icon: typeof LuLayoutGrid;
    emptyText: string;
  }
> = {
  todo: {
    label: 'Todo',
    singular: 'Board',
    icon: LuLayoutGrid,
    emptyText: 'No boards yet. Create your first Kanban board to get started.',
  },
  wishlist: {
    label: 'Wishlists',
    singular: 'Wishlist',
    icon: LuHeart,
    emptyText: 'No wishlists yet. Start tracking things you want.',
  },
  idea: {
    label: 'Idea Lists',
    singular: 'Idea List',
    icon: LuLightbulb,
    emptyText: 'No idea lists yet. Capture your thoughts before they vanish.',
  },
};

export default function TypeListGrid({ lists, type }: TypeListGridProps) {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [isCreateOpen, setIsCreateOpen] = useState(action === 'create');
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [prevAction, setPrevAction] = useState(action);

  if (action !== prevAction) {
    setPrevAction(action);
    if (action === 'create') {
      setIsCreateOpen(true);
    }
  }

  const handleCreateOpenChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open && action === 'create') {
      const params = new URLSearchParams(window.location.search);
      params.delete('action');
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  };

  const meta = TYPE_META[type];
  const Icon = meta.icon;

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
        <span aria-current='page' className='text-foreground font-medium'>{meta.label}</span>
      </nav>

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{meta.label}</h1>
          <p className='text-muted-foreground text-sm mt-1'>
            {lists.length}{' '}
            {lists.length === 1
              ? meta.singular.toLowerCase()
              : `${meta.singular.toLowerCase()}s`}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {type === 'todo' && (
            <Button
              variant='outline'
              onClick={() => setIsTemplatePickerOpen(true)}
              className='gap-2'
              id='open-template-picker'
              aria-label='Browse board templates'
            >
              Templates
            </Button>
          )}
          <Button
            onClick={() => setIsCreateOpen(true)}
            className='gap-2'
            id='create-new-list'
          >
            <LuPlus className='w-4 h-4' aria-hidden='true' />
            New {meta.singular}
          </Button>
        </div>
      </div>

      {/* Grid */}
      {lists.length === 0 ? (
        <div className='flex flex-col items-center justify-center min-h-75 bg-card border border-dashed rounded-2xl p-8 text-center'>
          <div className='w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4'>
            <Icon className='w-8 h-8 text-muted-foreground' />
          </div>
          <p className='text-muted-foreground max-w-sm'>{meta.emptyText}</p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            variant='outline'
            className='mt-4 gap-2'
            id='empty-create-list'
          >
            <LuPlus className='w-4 h-4' aria-hidden='true' />
            Create {meta.singular}
          </Button>
          {type === 'todo' && (
            <button
              type='button'
              onClick={() => setIsTemplatePickerOpen(true)}
              className='mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1'
              id='empty-open-templates'
            >
              Or start from a template →
            </button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}

      <CreateListModal
        type={type}
        open={isCreateOpen}
        onOpenChange={handleCreateOpenChange}
      />

      {type === 'todo' && (
        <TemplatePickerModal
          open={isTemplatePickerOpen}
          onOpenChange={setIsTemplatePickerOpen}
          onBlankBoard={() => setIsCreateOpen(true)}
        />
      )}
    </div>
  );
}
