'use client';

import Link from 'next/link';
import { LuLayoutGrid, LuHeart, LuLightbulb } from 'react-icons/lu';
import type { ListType } from '@/types/dto';

interface ListHubProps {
  counts: Record<ListType, number>;
}

const TYPE_CONFIG: {
  type: ListType;
  title: string;
  description: string;
  href: string;
  icon: typeof LuLayoutGrid;
  color: string;
  borderHover: string;
  iconBg: string;
}[] = [
  {
    type: 'todo',
    title: 'Todo',
    description: 'Kanban boards for managing tasks',
    href: '/list/todo',
    icon: LuLayoutGrid,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderHover: 'hover:border-blue-500/30',
    iconBg: 'bg-blue-500/15',
  },
  {
    type: 'wishlist',
    title: 'Wishlist',
    description: 'Track things you want with prices',
    href: '/list/wishlist',
    icon: LuHeart,
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    borderHover: 'hover:border-pink-500/30',
    iconBg: 'bg-pink-500/15',
  },
  {
    type: 'idea',
    title: 'Ideas',
    description: 'Brain dump — capture before you forget',
    href: '/list/ideas',
    icon: LuLightbulb,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-500/30',
    iconBg: 'bg-amber-500/15',
  },
];

export default function ListHub({ counts }: ListHubProps) {
  return (
    <div className='space-y-8'>
      {/* Breadcrumbs */}
      <nav className='flex items-center gap-1 text-sm text-muted-foreground'>
        <Link href='/app' className='hover:text-foreground transition-colors'>
          Kytbox
        </Link>
        <span className='text-muted-foreground'>/</span>
        <span className='text-foreground font-medium'>
          List
        </span>
      </nav>

      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>List</h1>
        <p className='text-muted-foreground mt-1'>
          Organize your tasks, wishes, and ideas in one place.
        </p>
      </div>

      {/* Type Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        {TYPE_CONFIG.map((config) => {
          const Icon = config.icon;
          const count = counts[config.type];

          return (
            <Link
              key={config.type}
              href={config.href}
              className={`group bg-card border rounded-2xl p-6 transition-all duration-200 ${config.borderHover} hover:shadow-md`}
            >
              <div className='space-y-4'>
                <div
                  className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${config.color.split(' ').slice(1).join(' ')}`} />
                </div>

                <div>
                  <h2 className='text-lg font-semibold group-hover:text-primary transition-colors'>
                    {config.title}
                  </h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {config.description}
                  </p>
                </div>

                <p className='text-sm font-medium text-muted-foreground'>
                  {count} {count === 1 ? 'list' : 'lists'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
