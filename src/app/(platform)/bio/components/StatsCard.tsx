'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { IconType } from 'react-icons';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  description?: string;
  href?: string;
  isLoading?: boolean;
  variant?: 'primary' | 'blue' | 'green' | 'orange';
  className?: string;
  hideSecondaryIcon?: boolean;
}

const variantStyles = {
  primary: {
    hover: 'group-hover:border-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    labelHover: 'group-hover:text-primary',
  },
  blue: {
    hover: 'group-hover:border-blue-500/20',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    labelHover: 'group-hover:text-blue-600',
  },
  green: {
    hover: 'group-hover:border-green-500/20',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600',
    labelHover: 'group-hover:text-green-600',
  },
  orange: {
    hover: 'group-hover:border-orange-500/20',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600',
    labelHover: 'group-hover:text-orange-600',
  },
};

export default function StatsCard({
  label,
  value,
  icon: Icon,
  description,
  href,
  isLoading,
  variant = 'primary',
  className,
  hideSecondaryIcon,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  const CardContent = (
    <div
      className={cn(
        'bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm transition duration-200 h-full',
        href && 'cursor-pointer',
        href && styles.hover,
        className,
      )}
    >
      <div className='flex flex-col gap-1.5 min-w-0'>
        <div
          className={cn(
            'flex items-center gap-2 text-muted-foreground transition-colors',
            href && styles.labelHover,
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4 shrink-0',
              !hideSecondaryIcon && 'xs:hidden',
            )}
          />
          <span className='text-sm font-medium truncate'>{label}</span>
        </div>
        {isLoading ? (
          <Skeleton className='h-8 w-16 rounded-md' />
        ) : (
          <p className='text-2xl font-bold tracking-tight truncate'>{value}</p>
        )}
        {description && (
          <p className='text-xs text-muted-foreground mt-1 truncate'>
            {description}
          </p>
        )}
      </div>
      {!hideSecondaryIcon && (
        <div
          className={cn(
            'hidden xs:flex p-3 rounded-full transition-transform',
            styles.iconBg,
            styles.iconColor,
            href && 'group-hover:scale-110',
          )}
        >
          <Icon className='w-5 h-5' />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className='block group h-full'
        onClick={(e) => {
          if (isLoading) e.preventDefault();
        }}
      >
        {CardContent}
      </a>
    );
  }

  return CardContent;
}
