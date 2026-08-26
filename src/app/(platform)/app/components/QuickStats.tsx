import Link from 'next/link';
import { LuMousePointerClick, LuWallet, LuListTodo, LuArrowUpRight } from 'react-icons/lu';
import { formatCurrency } from '@/lib/currency';

interface QuickStatsProps {
  clicksCount: number;
  cashflowBalance: number;
  openItemsCount: number;
  defaultCurrency: string | null;
}

export function QuickStats({
  clicksCount,
  cashflowBalance,
  openItemsCount,
  defaultCurrency,
}: QuickStatsProps) {
  const stats = [
    {
      name: 'Bio clicks',
      value: `${clicksCount.toLocaleString()} clicks`,
      description: 'Clicks in last 7 days',
      href: '/bio',
      icon: LuMousePointerClick,
      color: 'bg-primary/10 text-primary',
      borderHover: 'hover:border-primary/40',
    },
    {
      name: 'Cashflow',
      value: formatCurrency(cashflowBalance, defaultCurrency),
      description: 'Current combined balance',
      href: '/cashflow',
      icon: LuWallet,
      color: 'bg-accent text-accent-foreground',
      borderHover: 'hover:border-accent-foreground/40',
    },
    {
      name: 'Open items',
      value: `${openItemsCount.toLocaleString()} items`,
      description: 'Uncompleted items',
      href: '/list',
      icon: LuListTodo,
      color: 'bg-secondary text-secondary-foreground',
      borderHover: 'hover:border-secondary-foreground/40',
    },
  ];

  return (
    <div className='grid w-full grid-cols-3 gap-2.5 sm:gap-3'>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.name}
            href={stat.href}
            aria-label={`${stat.name}: ${stat.value}`}
            className={`group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-2xl sm:p-4 ${stat.borderHover}`}
          >
            <div className='flex items-center justify-between gap-1'>
              <div className='flex min-w-0 items-center gap-1.5 sm:gap-2'>
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-md sm:size-7 sm:rounded-lg ${stat.color}`}>
                  <Icon className='size-3 sm:size-3.5' aria-hidden='true' />
                </span>
                <p className='truncate text-[0.68rem] font-medium text-muted-foreground sm:text-xs'>{stat.name}</p>
              </div>
              <LuArrowUpRight className='hidden size-3 text-muted-foreground/60 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:block' aria-hidden='true' />
            </div>
            <div className='mt-2 sm:mt-3'>
              <p className='truncate text-xs font-semibold tracking-tight xs:text-sm sm:text-lg md:text-xl'>{stat.value}</p>
              <p className='mt-0.5 hidden truncate text-[0.65rem] text-muted-foreground sm:block'>{stat.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
