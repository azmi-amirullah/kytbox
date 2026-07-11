import { formatDistanceToNow } from 'date-fns';
import { LuLink2, LuWallet, LuListTodo, LuActivity } from 'react-icons/lu';

interface ActivityItem {
  type: string;
  title: string;
  context: string;
  created_at: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityDetails = (item: ActivityItem) => {
    switch (item.type) {
      case 'link':
        return {
          icon: LuLink2,
          color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
          message: `Added link "${item.title}"`,
          contextLabel: 'in Bio',
        };
      case 'entry':
        return {
          icon: LuWallet,
          color: item.context === 'Income'
            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
            : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
          message: `Recorded transaction "${item.title}"`,
          contextLabel: `as ${item.context}`,
        };
      case 'task':
        return {
          icon: LuListTodo,
          color: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
          message: `Created task "${item.title}"`,
          contextLabel: `in ${item.context}`,
        };
      default:
        return {
          icon: LuActivity,
          color: 'bg-muted text-muted-foreground',
          message: item.title,
          contextLabel: `in ${item.context}`,
        };
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed bg-card/30 text-center">
          <div className="p-3 rounded-full bg-muted text-muted-foreground/60 mb-3">
            <LuActivity className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-sm">No recent activity</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
            Your actions across Bio, Cashflow, and Lists will appear here.
          </p>
        </div>
      ) : (
        <div className="relative pl-4 border-l border-border/60 ml-3 space-y-6">
          {activities.map((activity, idx) => {
            const details = getActivityDetails(activity);
            const Icon = details.icon;
            
            // Format time safely, handle potential invalid date strings
            let timeAgo = '';
            try {
              timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
            } catch {
              timeAgo = 'recently';
            }

            return (
              <div key={idx} className="relative group">
                {/* Timeline Dot with Icon */}
                <div className={`absolute -left-[27px] top-0.5 p-1 rounded-full border bg-background transition-transform group-hover:scale-110 ${details.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pl-2">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{details.message}</span>{' '}
                    <span className="text-muted-foreground text-xs">{details.contextLabel}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap sm:pl-4">
                    {timeAgo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
