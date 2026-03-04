import { formatCurrencyCompact } from '@/lib/currency';

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

  return (
    <div className='bg-popover border border-border text-popover-foreground p-3 rounded-lg shadow-md text-sm'>
      <p className='font-medium mb-1.5'>{label}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          className='flex items-center gap-2'
          style={{ color: entry.color }}
        >
          <span
            className='inline-block w-2.5 h-2.5 rounded-full shrink-0'
            style={{ backgroundColor: entry.color }}
          />
          <span className='capitalize'>{entry.name}:</span>
          <span className='font-semibold'>
            {formatCurrencyCompact(Number(entry.value ?? 0), currency)}
          </span>
        </p>
      ))}
    </div>
  );
}
