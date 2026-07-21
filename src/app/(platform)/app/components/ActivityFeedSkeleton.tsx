import { Skeleton } from '@/components/ui/skeleton';

export function ActivityFeedSkeleton() {
  return (
    <div className="w-full">
      <div className="h-4 w-32 bg-muted rounded mb-4 animate-pulse" />
      <div className="relative pl-4 border-l border-border/60 ml-3 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative flex items-center justify-between gap-4 pl-2">
            <Skeleton className="absolute -left-6.75 top-0.5 w-6 h-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
