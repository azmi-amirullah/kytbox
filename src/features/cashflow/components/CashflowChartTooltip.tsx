import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
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
  const hasIncomeAndExpense =
    incomeEntry !== undefined && expenseEntry !== undefined;

  const income = Number(incomeEntry?.value ?? 0);
  const expense = Number(expenseEntry?.value ?? 0);
  const net = income - expense;
  const savingsRate =
    income > 0
      ? Math.round(((Math.max(0, net) / income) * 100 + Number.EPSILON) * 10) /
        10
      : 0;

  return (
    <div className='bg-popover border border-border/80 text-popover-foreground p-3 rounded-lg shadow-lg text-sm min-w-44'>
      <p className='font-semibold text-xs text-foreground mb-2'>{label}</p>
      <div className='space-y-1.5'>
        {payload.map((entry) => {
          const entryColor = entry.color ?? entry.fill ?? 'currentColor';
          return (
            <div
              key={String(entry.dataKey ?? entry.name)}
              className='flex items-center justify-between gap-3 text-xs'
            >
              <span className='flex items-center gap-1.5 text-muted-foreground'>
                <span
                  className='inline-block w-2.5 h-2.5 rounded-xs shrink-0'
                  style={{ backgroundColor: entryColor }}
                />
                <span className='capitalize font-medium text-foreground/80'>
                  {entry.name}:
                </span>
              </span>
              <span className='font-semibold font-mono text-foreground'>
                {formatCurrencyCompact(Number(entry.value ?? 0), currency)}
              </span>
            </div>
          );
        })}
      </div>

      {hasIncomeAndExpense && (
        <div className='border-t border-border mt-2.5 pt-2 flex items-center justify-between gap-3 text-xs'>
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
