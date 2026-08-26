'use client';

import { formatCurrencyCompact } from '@/lib/currency';
import { useContainerSize } from '../lib/useContainerSize';
import { Loader } from '@/components/ui/loader';

import { PieChart, Pie, Sector, Tooltip, Legend } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  fill?: string;
}

interface CategoryChartProps {
  data: CategoryData[];
  currency: string | null;
  title: string;
}

interface CustomSectorProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill?: string;
}

export function CategoryChart({ data, currency, title }: CategoryChartProps) {
  const total = data ? data.reduce((sum, item) => sum + item.value, 0) : 0;
  const hasData = data && data.length > 0 && total > 0;
  const [containerRef, width, height] = useContainerSize();

  const renderCustomSector = (props: CustomSectorProps) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill = 'var(--muted-foreground)',
    } = props;
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className='stroke-background hover:opacity-80 transition-opacity'
        strokeWidth={2}
      />
    );
  };

  return (
    <div className='w-full'>
      <div className='mb-4 text-center pb-1'>
        <h3 className='text-sm font-semibold tracking-tight text-foreground'>{title}</h3>
      </div>

      {!hasData ? (
        <div className='flex h-80 flex-col items-center justify-center text-muted-foreground border rounded-xl bg-muted/20 border-dashed'>
          <p className='text-sm'>No category data available</p>
        </div>
      ) : (
        <div ref={containerRef} className='h-80 w-full'>
          {width === 0 || height === 0 ? (
            <Loader size='md' className='h-full w-full py-0' text='' />
          ) : (
            <PieChart width={width} height={height}>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                innerRadius={75}
                outerRadius={115}
                paddingAngle={2}
                dataKey='value'
                stroke='none'
                shape={renderCustomSector}
                isAnimationActive={false}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const rawPayload = payload[0].payload;
                    const isObject = typeof rawPayload === 'object' && rawPayload !== null;
                    const fillColor =
                      isObject && 'fill' in rawPayload && typeof rawPayload.fill === 'string'
                        ? rawPayload.fill
                        : undefined;
                    const itemName =
                      isObject && 'name' in rawPayload && typeof rawPayload.name === 'string'
                        ? rawPayload.name
                        : '';
                    const value = Number(payload[0].value ?? 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return (
                      <div className='bg-popover border border-border/80 rounded-lg shadow-md p-2.5 text-xs text-popover-foreground outline-none'>
                        <p
                          className='font-semibold'
                          style={{ color: fillColor }}
                        >
                          {itemName}
                        </p>
                        <p className='text-muted-foreground mt-1 font-mono font-medium'>
                          {formatCurrencyCompact(value, currency)}{' '}
                          <span className='text-[10px] opacity-80'>({percentage}%)</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                isAnimationActive={false}
              />
              <Legend
                verticalAlign='bottom'
                height={36}
                iconType='circle'
                wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
              />
            </PieChart>
          )}
        </div>
      )}
    </div>
  );
}
