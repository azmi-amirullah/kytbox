'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<'light' | 'dark', string>;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ReactElement;
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot='chart'
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/20 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme !== undefined || itemConfig.color !== undefined,
  );

  if (colorConfig.length === 0) {
    return null;
  }

  const themes: Array<{ theme: 'light' | 'dark'; prefix: string }> = [
    { theme: 'light', prefix: '' },
    { theme: 'dark', prefix: '.dark' },
  ];

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: themes
          .map(
            ({ theme, prefix }) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme] ?? itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

export interface ChartTooltipPayloadItem {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
  type?: string;
  [key: string]: unknown;
}

function ChartTooltipContent({
  active,
  payload = [],
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<'div'> & {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: 'line' | 'dot' | 'dashed';
  nameKey?: string;
  labelKey?: string;
  labelClassName?: string;
  labelFormatter?: (
    value: React.ReactNode,
    payload: ChartTooltipPayloadItem[],
  ) => React.ReactNode;
  formatter?: (
    value: unknown,
    name: unknown,
    item: unknown,
    index: number,
    payload: unknown,
  ) => React.ReactNode;
  color?: string;
}) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || payload.length === 0) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === 'string'
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>
          {labelFormatter(value ?? label, payload)}
        </div>
      );
    }

    if (!value && !label) {
      return null;
    }

    return (
      <div className={cn('font-medium', labelClassName)}>
        {value ?? label}
      </div>
    );
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!active || payload.length === 0) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot';

  return (
    <div
      className={cn(
        'grid min-w-32 items-start gap-1.5 rounded-lg border border-border/60 bg-popover text-popover-foreground px-3 py-2 text-xs shadow-md',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className='grid gap-1.5'>
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const fill = typeof item.payload?.fill === 'string' ? item.payload.fill : undefined;
            const itemColor = typeof item.color === 'string' ? item.color : undefined;
            const indicatorColor = color ?? fill ?? itemColor ?? 'currentColor';

            return (
              <div
                key={index}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center',
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            'shrink-0 rounded-xs',
                            {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent':
                                indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed',
                            },
                          )}
                          style={{
                            backgroundColor:
                              indicator === 'dashed' ? 'transparent' : indicatorColor,
                            borderColor: indicatorColor,
                          }}
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between leading-none gap-2',
                        nestLabel ? 'items-end' : 'items-center',
                      )}
                    >
                      <div className='grid gap-1.5'>
                        {nestLabel ? tooltipLabel : null}
                        <span className='text-muted-foreground'>
                          {itemConfig?.label ?? item.name}
                        </span>
                      </div>
                      {item.value != null && (
                        <span className='font-mono font-medium text-foreground tabular-nums'>
                          {typeof item.value === 'number'
                            ? item.value.toLocaleString()
                            : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

export interface ChartLegendPayloadItem {
  dataKey?: string | number;
  value?: string | number;
  color?: string;
  type?: string;
  [key: string]: unknown;
}

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> & {
  hideIcon?: boolean;
  nameKey?: string;
  payload?: ChartLegendPayloadItem[];
  verticalAlign?: 'top' | 'bottom';
}) {
  const { config } = useChart();

  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4 text-xs font-medium',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const itemColor = typeof item.color === 'string' ? item.color : 'currentColor';

          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground',
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className='h-2.5 w-2.5 shrink-0 rounded-xs'
                  style={{
                    backgroundColor: itemColor,
                  }}
                />
              )}
              <span className='text-foreground'>{itemConfig?.label ?? item.value}</span>
            </div>
          );
        })}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (!isRecord(payload)) {
    return undefined;
  }

  const innerPayload = isRecord(payload.payload) ? payload.payload : undefined;

  let configLabelKey: string = key;

  const keyVal = payload[key];
  if (typeof keyVal === 'string') {
    configLabelKey = keyVal;
  } else if (innerPayload) {
    const innerKeyVal = innerPayload[key];
    if (typeof innerKeyVal === 'string') {
      configLabelKey = innerKeyVal;
    }
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
