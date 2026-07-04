'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ListDTO, ListType } from '@/types/dto';
import ListCard from './ListCard';
import CreateListModal from './CreateListModal';
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const meta = TYPE_META[type];
  const Icon = meta.icon;

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
        <span className='text-foreground font-medium'>{meta.label}</span>
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
        <Button onClick={() => setIsCreateOpen(true)} className='gap-2'>
          <LuPlus className='w-4 h-4' />
          New {meta.singular}
        </Button>
      </div>

      {/* Grid */}
      {lists.length === 0 ? (
        <div className='flex flex-col items-center justify-center min-h-[300px] bg-card border border-dashed rounded-2xl p-8 text-center'>
          <div className='w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4'>
            <Icon className='w-8 h-8 text-muted-foreground' />
          </div>
          <p className='text-muted-foreground max-w-sm'>{meta.emptyText}</p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            variant='outline'
            className='mt-4 gap-2'
          >
            <LuPlus className='w-4 h-4' />
            Create {meta.singular}
          </Button>
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
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
