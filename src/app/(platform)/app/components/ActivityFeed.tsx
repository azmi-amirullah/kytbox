import { formatDistanceToNow } from 'date-fns'
import { LuLink2, LuWallet, LuListTodo, LuActivity } from 'react-icons/lu'

interface ActivityItem {
  type: string
  title: string
  context: string
  created_at: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityDetails = (item: ActivityItem) => {
    switch (item.type) {
      case 'link':
        return {
          icon: LuLink2,
          color: 'bg-primary/10 text-primary',
          message: `Added link "${item.title}"`,
          contextLabel: 'in Bio',
        }
      case 'entry':
        return {
          icon: LuWallet,
          color:
            item.context === 'Income'
              ? 'bg-accent text-accent-foreground'
              : 'bg-destructive/10 text-destructive',
          message: `Recorded transaction "${item.title}"`,
          contextLabel: `as ${item.context}`,
        }
      case 'task':
        return {
          icon: LuListTodo,
          color: 'bg-secondary text-secondary-foreground',
          message: `Created task "${item.title}"`,
          contextLabel: `in ${item.context}`,
        }
      default:
        return {
          icon: LuActivity,
          color: 'bg-muted text-muted-foreground',
          message: item.title,
          contextLabel: `in ${item.context}`,
        }
    }
  }

  return (
    <section
      className='w-full rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm'
      aria-labelledby='recent-activity-heading'
    >
      <h2
        id='recent-activity-heading'
        className='text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground'
      >
        Recent activity
      </h2>
      <p className='mt-2 text-sm text-muted-foreground'>
        Across your active workspace.
      </p>

      {activities.length === 0 ? (
        <div className='mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/90 bg-background/50 p-8 text-center'>
          <div className='mb-3 rounded-2xl bg-secondary p-3 text-secondary-foreground'>
            <LuActivity className='size-6' aria-hidden='true' />
          </div>
          <h3 className='text-sm font-semibold'>No activity yet</h3>
          <p className='mt-1 max-w-65 text-xs leading-5 text-muted-foreground'>
            Your workspace activity will appear here.
          </p>
        </div>
      ) : (
        <div className='relative ml-3 mt-7 space-y-6 border-l border-border/70 pl-5'>
          {activities.map((activity, idx) => {
            const details = getActivityDetails(activity)
            const Icon = details.icon

            // Format time safely, handle potential invalid date strings
            let timeAgo = ''
            try {
              timeAgo = formatDistanceToNow(new Date(activity.created_at), {
                addSuffix: true,
              })
            } catch {
              timeAgo = 'recently'
            }

            return (
              <div
                key={`${activity.type}-${activity.created_at}-${activity.title}-${idx}`}
                className='group relative'
              >
                {/* Timeline Dot with Icon */}
                <div
                  className={`absolute -left-7.5 top-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-background transition-transform group-hover:scale-110 ${details.color}`}
                >
                  <Icon className='size-3.5' aria-hidden='true' />
                </div>

                <div className='flex flex-col justify-between gap-1 pl-2 sm:flex-row sm:items-baseline'>
                  <div className='text-sm'>
                    <span className='font-medium text-foreground'>
                      {details.message}
                    </span>{' '}
                    <span className='text-xs text-muted-foreground'>
                      {details.contextLabel}
                    </span>
                  </div>
                  <time
                    dateTime={activity.created_at}
                    className='whitespace-nowrap text-xs text-muted-foreground sm:pl-4'
                  >
                    {timeAgo}
                  </time>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
