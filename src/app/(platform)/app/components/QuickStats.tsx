import { LuMousePointerClick, LuWallet, LuListTodo } from 'react-icons/lu';
import { formatCurrency } from '@/lib/currency';

interface QuickStatsProps {
  clicksCount: number;
  cashflowBalance: number;
  activeTasksCount: number;
  defaultCurrency: string | null;
}

export function QuickStats({
  clicksCount,
  cashflowBalance,
  activeTasksCount,
  defaultCurrency,
}: QuickStatsProps) {
  const stats = [
    {
      name: 'Bio Clicks',
      value: `${clicksCount.toLocaleString()} clicks`,
      description: 'Clicks in the last 7 days',
      icon: LuMousePointerClick,
      color: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400',
    },
    {
      name: 'Cashflow Balance',
      value: formatCurrency(cashflowBalance, defaultCurrency),
      description: 'Current combined balance',
      icon: LuWallet,
      color: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    {
      name: 'Active Tasks',
      value: `${activeTasksCount.toLocaleString()} tasks`,
      description: 'Uncompleted list tasks',
      icon: LuListTodo,
      color: 'bg-sky-500/10 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="flex items-center gap-4 p-6 rounded-2xl border bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-md"
          >
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">{stat.name}</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{stat.value}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{stat.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
