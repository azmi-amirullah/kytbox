import Link from 'next/link';
import {
  LuPlus,
  LuLink2,
  LuWallet,
  LuListTodo,
  LuChevronRight,
} from 'react-icons/lu';

export function QuickActions() {
  const actions = [
    {
      name: 'Add a Bio link',
      description: 'Publish a link on your Bio page',
      href: '/bio?action=add',
      icon: LuLink2,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
      hoverBorder: 'hover:border-primary/35',
    },
    {
      name: 'Record a cashflow entry',
      description: 'Add income or an expense to Cashflow',
      href: '/cashflow?action=add',
      icon: LuWallet,
      colorClass: 'text-accent-foreground',
      bgClass: 'bg-accent',
      hoverBorder: 'hover:border-accent-foreground/35',
    },
    {
      name: 'Create a todo board',
      description: 'Start with a new Todo board',
      href: '/list/todo?action=create',
      icon: LuListTodo,
      colorClass: 'text-secondary-foreground',
      bgClass: 'bg-secondary',
      hoverBorder: 'hover:border-secondary-foreground/35',
    },
  ];

  return (
    <div className='w-full'>
      <h2 className='mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
        Quick actions
      </h2>
      <div className='flex flex-col gap-3'>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              href={action.href}
              className={`group relative flex min-h-16 items-center gap-4 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${action.hoverBorder}`}
            >
              {/* Icon Container */}
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${action.bgClass} ${action.colorClass}`}
              >
                <Icon className='size-5' aria-hidden='true' />
              </div>

              {/* Text Info */}
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-semibold text-foreground transition-colors group-hover:text-primary'>
                  {action.name}
                </h3>
                <p className='mt-1 truncate text-xs text-muted-foreground'>
                  {action.description}
                </p>
              </div>

              {/* Action Indicator */}
              <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-secondary-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:bg-primary group-focus-visible:text-primary-foreground'>
                <LuPlus className='size-3.5 group-hover:hidden group-focus-visible:hidden' aria-hidden='true' />
                <LuChevronRight className='hidden size-3.5 group-hover:block group-focus-visible:block' aria-hidden='true' />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
