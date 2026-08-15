import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
}

interface CashflowChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  currency: string | null;
}

export function CashflowChartTooltip({
  active,
  payload,
  label,
  currency,
}: CashflowChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const incomeEntry = payload.find((p) => p.dataKey === 'income');
  const expenseEntry = payload.find((p) => p.dataKey === 'expense');
  const hasIncomeAndExpense = incomeEntry !== undefined && expenseEntry !== undefined;

  const income = Number(incomeEntry?.value ?? 0);
  const expense = Number(expenseEntry?.value ?? 0);
  const net = income - expense;
  const savingsRate =
    income > 0 ? Math.round(((Math.max(0, net) / income) * 100 + Number.EPSILON) * 10) / 10 : 0;

  return (
    <div className='bg-popover border border-border text-popover-foreground p-3 rounded-lg shadow-md text-sm min-w-40'>
      <p className='font-medium mb-1.5'>{label}</p>
      <div className='space-y-1'>
        {payload.map((entry) => (
          <p
            key={String(entry.dataKey)}
            className='flex items-center justify-between gap-3 text-xs'
            style={{ color: entry.color }}
          >
            <span className='flex items-center gap-1.5'>
              <span
                className='inline-block w-2 h-2 rounded-full shrink-0'
                style={{ backgroundColor: entry.color }}
              />
              <span className='capitalize'>{entry.name}:</span>
            </span>
            <span className='font-semibold font-mono'>
              {formatCurrencyCompact(Number(entry.value ?? 0), currency)}
            </span>
          </p>
        ))}
      </div>

      {hasIncomeAndExpense && (
        <div className='border-t border-border mt-2 pt-1.5 flex items-center justify-between gap-3 text-xs'>
          <span className='text-muted-foreground font-medium'>Net Savings:</span>
          <span
            className={cn(
              'font-mono font-semibold',
              net > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : net < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-muted-foreground',
            )}
          >
            {net > 0 ? '+' : ''}
            {formatCurrencyCompact(net, currency)}
            {income > 0 && (
              <span className='text-[10px] ml-1 font-normal opacity-80'>
                ({savingsRate}%)
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
