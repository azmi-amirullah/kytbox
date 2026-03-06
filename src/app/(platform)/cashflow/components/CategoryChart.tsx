'use client';

import { formatCurrencyCompact } from '@/lib/currency';

import {
  PieChart,
  Pie,
  Sector,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className='pt-6'>
      <CardContent>
        <div className='mb-4 text-center pb-2'>
          <h3 className='font-semibold tracking-tight'>{title}</h3>
        </div>

        {!hasData ? (
          <div className='flex h-[350px] flex-col items-center justify-center text-muted-foreground border rounded-xl bg-muted/20 border-dashed'>
            <p className='text-sm'>No category data available</p>
          </div>
        ) : (
          <div className='h-[350px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
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
                      const data = payload[0].payload;
                      const value = payload[0].value;
                      const percentage = ((value / total) * 100).toFixed(1);
                      return (
                        <div className='bg-background border rounded-lg shadow-md p-2.5 text-sm outline-none'>
                          <p
                            className='font-medium'
                            style={{ color: data.fill }}
                          >
                            {data.name}
                          </p>
                          <p className='text-muted-foreground mt-0.5'>
                            {formatCurrencyCompact(value, currency)} (
                            {percentage}%)
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
                  wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
