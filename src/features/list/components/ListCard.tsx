'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  LuLayoutGrid,
  LuHeart,
  LuLightbulb,
  LuEllipsisVertical,
  LuPencil,
  LuTrash2,
  LuGlobe,
  LuLock,
} from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { ListDTO, ListType } from '@/types/dto';
import EditListModal from './EditListModal';
import DeleteListDialog from './DeleteListDialog';
import { toggleListPublic } from '../actions';
import { toast } from 'react-toastify';

const TYPE_CONFIG: Record<
  ListType,
  { icon: typeof LuLayoutGrid; badge: string; color: string; href: string }
> = {
  todo: {
    icon: LuLayoutGrid,
    badge: 'Board',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    href: '/list/todo',
  },
  wishlist: {
    icon: LuHeart,
    badge: 'Wishlist',
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    href: '/list/wishlist',
  },
  idea: {
    icon: LuLightbulb,
    badge: 'Idea',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    href: '/list/ideas',
  },
};

interface ListCardProps {
  list: ListDTO;
}

export default function ListCard({ list }: ListCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const config = TYPE_CONFIG[list.type];
  const Icon = config.icon;
  const progress =
    list.item_count > 0
      ? Math.round((list.completed_count / list.item_count) * 100)
      : 0;

  const handleTogglePublic = async () => {
    const result = await toggleListPublic(list.id, !list.is_public);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(list.is_public ? 'List is now private' : 'List is now public');
    }
  };

  return (
    <>
      <div className='group relative bg-card border rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20'>
        <Link
          href={`${config.href}/${list.id}`}
          className='absolute inset-0 rounded-2xl z-0'
          aria-label={`Open ${list.title}`}
        />

        <div className='relative z-10 space-y-3 pointer-events-none'>
          {/* Top row: badge + actions */}
          <div className='flex items-start justify-between'>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.color}`}
            >
              <Icon className='w-3 h-3' />
              {config.badge}
            </span>

            <div className='pointer-events-auto'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'
                    aria-label='List actions'
                  >
                    <LuEllipsisVertical className='w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <LuPencil className='w-4 h-4 mr-2' />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTogglePublic}>
                    {list.is_public ? (
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
                  <DropdownMenuItem
                    onClick={() => setIsDeleteOpen(true)}
                    className='text-destructive focus:text-destructive'
                  >
                    <LuTrash2 className='w-4 h-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title + description */}
          <div>
            <h3 className='font-semibold text-base truncate'>{list.title}</h3>
            {list.description && (
              <p className='text-sm text-muted-foreground line-clamp-2 mt-0.5'>
                {list.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
            <span>
              {list.item_count} {list.item_count === 1 ? 'item' : 'items'}
            </span>
            {list.item_count > 0 && (
              <>
                <span className='text-border'>•</span>
                <span>
                  {list.completed_count}/{list.item_count} done
                </span>
              </>
            )}
            {list.is_public && (
              <>
                <span className='text-border'>•</span>
                <LuGlobe className='w-3 h-3' />
              </>
            )}
          </div>

          {/* Progress bar */}
          {list.item_count > 0 && (
            <div className='w-full h-1.5 bg-muted rounded-full overflow-hidden'>
              <div
                className='h-full bg-primary/60 rounded-full transition-all duration-500'
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Updated at */}
          {list.updated_at && (
            <p className='text-xs text-muted-foreground/70'>
              {(() => {
                const date = new Date(list.updated_at);
                const now = new Date();
                const safeDate = date > now ? now : date;
                return formatDistanceToNow(safeDate, { addSuffix: true });
              })()}
            </p>
          )}
        </div>
      </div>

      <EditListModal
        list={list}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteListDialog
        list={list}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
