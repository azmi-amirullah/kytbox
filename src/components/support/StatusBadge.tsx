import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  return (
    <Badge
      variant='outline'
      className={cn('capitalize font-normal', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
