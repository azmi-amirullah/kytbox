import { LuMousePointerClick, LuWallet, LuListTodo } from 'react-icons/lu';
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
      description: 'Clicks in the last 7 days',
      icon: LuMousePointerClick,
      color: 'bg-primary/10 text-primary',
    },
    {
      name: 'Cashflow balance',
      value: formatCurrency(cashflowBalance, defaultCurrency),
      description: 'Current combined balance',
      icon: LuWallet,
      color: 'bg-accent text-accent-foreground',
    },
    {
      name: 'Open items',
      value: `${openItemsCount.toLocaleString()} items`,
      description: 'Uncompleted items across your lists',
      icon: LuListTodo,
      color: 'bg-secondary text-secondary-foreground',
    },
  ];

  return (
    <div className='grid w-full gap-2 sm:grid-cols-3'>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'>
            <div className='flex items-center gap-2'>
              <span className={`flex size-7 items-center justify-center rounded-lg ${stat.color}`}>
                <Icon className='size-3.5' aria-hidden='true' />
              </span>
              <p className='truncate text-[0.68rem] font-medium text-muted-foreground'>{stat.name}</p>
            </div>
            <p className='mt-3 text-xl font-semibold tracking-[-0.04em]'>{stat.value}</p>
            <p className='mt-1 text-[0.65rem] text-muted-foreground'>{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}
