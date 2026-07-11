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
      name: 'Add Bio Link',
      description: 'Add a new link to your public Bio page',
      href: '/bio?action=add',
      icon: LuLink2,
      colorClass: 'text-indigo-500 dark:text-indigo-400',
      bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      hoverBorder: 'hover:border-indigo-500/35 dark:hover:border-indigo-500/50',
    },
    {
      name: 'Add Cashflow Entry',
      description: 'Record an income or expense transaction',
      href: '/cashflow?action=add',
      icon: LuWallet,
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      hoverBorder:
        'hover:border-emerald-500/35 dark:hover:border-emerald-500/50',
    },
    {
      name: 'New Todo Board',
      description: 'Create a new todo, wishlist, or idea board',
      href: '/list/todo?action=create',
      icon: LuListTodo,
      colorClass: 'text-sky-500 dark:text-sky-400',
      bgClass: 'bg-sky-500/10 dark:bg-sky-500/20',
      hoverBorder: 'hover:border-sky-500/35 dark:hover:border-sky-500/50',
    },
  ];

  return (
    <div className='w-full'>
      <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
        Quick Actions
      </h2>
      <div className='flex flex-col gap-3'>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              href={action.href}
              className={`group relative flex items-center gap-4 p-4 rounded-xl border bg-card transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${action.hoverBorder}`}
            >
              {/* Icon Container */}
              <div
                className={`p-2.5 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-105 ${action.bgClass} ${action.colorClass}`}
              >
                <Icon className='w-5 h-5' />
              </div>

              {/* Text Info */}
              <div className='flex-1 min-w-0'>
                <h4 className='font-semibold text-sm text-foreground group-hover:text-primary transition-colors'>
                  {action.name}
                </h4>
                <p className='text-xs text-muted-foreground mt-0.5 truncate'>
                  {action.description}
                </p>
              </div>

              {/* Action Indicator */}
              <div className='flex items-center justify-center w-6 h-6 rounded-full bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0'>
                <LuPlus className='w-3.5 h-3.5 group-hover:hidden' />
                <LuChevronRight className='w-3.5 h-3.5 hidden group-hover:block' />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
