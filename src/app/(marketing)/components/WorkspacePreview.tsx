import {
  LuArrowRight,
  LuArrowUpRight,
  LuBell,
  LuFileText,
  LuLifeBuoy,
  LuLink2,
  LuListTodo,
  LuMousePointerClick,
  LuPlus,
  LuSearch,
  LuWallet,
} from 'react-icons/lu'

const stats = [
  {
    label: 'Bio clicks',
    value: '184 clicks',
    description: 'Last 7 days',
    icon: LuMousePointerClick,
    color: 'bg-primary/10 text-primary',
  },
  {
    label: 'Cashflow',
    value: '$4,280',
    description: 'Combined balance',
    icon: LuWallet,
    color: 'bg-accent text-accent-foreground',
  },
  {
    label: 'Open items',
    value: '12 items',
    description: 'Across your lists',
    icon: LuListTodo,
    color: 'bg-secondary text-secondary-foreground',
  },
]

const recentActivity = [
  {
    title: 'Client payment',
    context: 'Income',
    time: 'about 15 hours ago',
    color: 'bg-accent text-accent-foreground',
  },
  {
    title: 'Workspace tools',
    context: 'Expense',
    time: 'about 18 hours ago',
    color: 'bg-destructive/10 text-destructive',
  },
  {
    title: 'Rent & utilities',
    context: 'Expense',
    time: 'about 20 hours ago',
    color: 'bg-destructive/10 text-destructive',
  },
]

const appTools = [
  {
    name: 'Bio',
    description: 'Share your links from a page that feels like you',
    icon: LuLink2,
    color: 'bg-primary/10 text-primary',
  },
  {
    name: 'Cashflow',
    description: 'Track income and expenses in one clear view',
    icon: LuWallet,
    color: 'bg-accent text-accent-foreground',
  },
  {
    name: 'Invoice',
    description: 'Create professional invoices & statements',
    icon: LuFileText,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    name: 'List',
    description: 'Organize tasks, wishlists, and ideas',
    icon: LuListTodo,
    color: 'bg-secondary text-secondary-foreground',
  },
]

const quickActions = [
  {
    name: 'Add a Bio link',
    description: 'Publish a link on your Bio page',
    icon: LuLink2,
    color: 'bg-primary/10 text-primary',
  },
  {
    name: 'Record cashflow entry',
    description: 'Add income or an expense',
    icon: LuWallet,
    color: 'bg-accent text-accent-foreground',
  },
  {
    name: 'Create a todo board',
    description: 'Start with a new Todo board',
    icon: LuListTodo,
    color: 'bg-secondary text-secondary-foreground',
  },
]

export function WorkspacePreview() {
  return (
    <div className='relative mx-auto w-full max-w-2xl lg:-mb-32 lg:origin-top lg:scale-[0.8] lg:translate-y-8'>
      <div
        className='pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-primary/15 blur-3xl'
        aria-hidden='true'
      />
      <div
        data-preview-shell
        className='relative overflow-hidden rounded-4xl border border-border/80 bg-card p-2 shadow-2xl shadow-primary/10'
      >
        <div
          role='img'
          aria-label='Kytbox example workspace preview showing sample stats, recent activity, app tools, quick actions, and help'
        >
          <div className='flex items-center justify-between gap-4 border-b border-border/80 px-4 py-3 text-[0.68rem] font-medium text-muted-foreground sm:px-5'>
            <div className='flex items-center gap-3'>
              <div className='flex gap-1.5' aria-hidden='true'>
                <span className='size-2 rounded-full bg-foreground/15' />
                <span className='size-2 rounded-full bg-foreground/15' />
                <span className='size-2 rounded-full bg-foreground/15' />
              </div>
              <span className='font-mono uppercase tracking-[0.16em]'>
                kytbox / overview
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <span className='hidden items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 sm:flex'>
                <LuSearch className='size-3' aria-hidden='true' />
                Search
              </span>
              <LuBell className='size-3.5' aria-hidden='true' />
              <span className='flex size-7 items-center justify-center rounded-full bg-foreground text-[0.62rem] font-semibold text-background'>
                AA
              </span>
            </div>
          </div>

          <div className='p-2 sm:p-3'>
            <div className='rounded-3xl bg-background p-4 sm:p-5'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <p className='font-mono text-[0.64rem] uppercase tracking-[0.18em] text-muted-foreground'>
                    Workspace overview
                  </p>
                  <h2 className='mt-2 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl'>
                    Welcome back.
                  </h2>
                  <p className='mt-1 max-w-md text-xs leading-5 text-muted-foreground'>
                    A clear view of your active workspace.
                  </p>
                </div>
                <span className='rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground'>
                  Example workspace
                </span>
              </div>

              <div className='mt-5 grid grid-cols-3 gap-2 sm:gap-3'>
                {stats.map(
                  ({ label, value, description, icon: Icon, color }) => (
                    <div
                      key={label}
                      className='flex flex-col justify-between rounded-xl border border-border/80 bg-card p-2.5 shadow-sm sm:rounded-2xl sm:p-3.5'
                    >
                      <div className='flex items-center justify-between gap-1'>
                        <div className='flex min-w-0 items-center gap-1.5 sm:gap-2'>
                          <span
                            className={[
                              'flex size-6 shrink-0 items-center justify-center rounded-md sm:size-7 sm:rounded-lg',
                              color,
                            ].join(' ')}
                          >
                            <Icon className='size-3 sm:size-3.5' aria-hidden='true' />
                          </span>
                          <p className='truncate text-[0.65rem] font-medium text-muted-foreground sm:text-xs'>
                            {label}
                          </p>
                        </div>
                        <LuArrowUpRight
                          className='hidden size-3 text-muted-foreground/60 sm:block'
                          aria-hidden='true'
                        />
                      </div>
                      <div className='mt-2'>
                        <p className='truncate text-xs font-semibold tracking-tight xs:text-sm sm:text-base'>
                          {value}
                        </p>
                        <p className='mt-0.5 hidden truncate text-[0.6rem] text-muted-foreground sm:block'>
                          {description}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className='mt-5 border-t border-border/80 pt-5'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <h3 className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                      Your workspace
                    </h3>
                    <p className='mt-0.5 text-xs text-muted-foreground'>
                      Open a tool when you need it.
                    </p>
                  </div>
                  <span className='font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground/70'>
                    04 active tools
                  </span>
                </div>
                <div className='mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3'>
                  {appTools.map(({ name, description, icon: Icon, color }) => (
                    <div
                      key={name}
                      className='flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3 shadow-sm sm:rounded-2xl sm:p-3.5'
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <span
                          className={[
                            'flex size-8 items-center justify-center rounded-lg sm:size-9 sm:rounded-xl',
                            color,
                          ].join(' ')}
                        >
                          <Icon className='size-3.5 sm:size-4' aria-hidden='true' />
                        </span>
                        <LuArrowRight
                          className='size-3.5 text-muted-foreground'
                          aria-hidden='true'
                        />
                      </div>
                      <div className='mt-3'>
                        <p className='truncate text-xs font-semibold'>{name}</p>
                        <p className='mt-0.5 line-clamp-2 text-[0.62rem] leading-tight text-muted-foreground sm:text-[0.65rem] sm:leading-4'>
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='mt-5 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]'>
                <div className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'>
                  <div>
                    <h3 className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                      Recent activity
                    </h3>
                    <p className='mt-1 text-[0.65rem] text-muted-foreground'>
                      Across your active workspace.
                    </p>
                  </div>
                  <div className='relative ml-2 mt-5 space-y-4 border-l border-border/70 pl-4 sm:space-y-5 sm:pl-5'>
                    {recentActivity.map(
                      ({ title, context, time, color }, index) => (
                        <div
                          key={`${title}-${time}-${index}`}
                          className='group relative'
                        >
                          <div
                            className={`absolute -left-6.5 top-0.5 flex size-5 items-center justify-center rounded-full border border-border bg-background ${color}`}
                          >
                            <LuWallet className='size-3' aria-hidden='true' />
                          </div>
                          <div className='flex min-w-0 flex-col justify-between gap-1 pl-1 sm:flex-row sm:items-baseline'>
                            <p className='min-w-0 text-[0.68rem] leading-4'>
                              <span className='font-medium text-foreground'>
                                Recorded transaction &quot;{title}&quot;
                              </span>{' '}
                              <span className='text-[0.6rem] text-muted-foreground'>
                                as {context}
                              </span>
                            </p>
                            <span className='whitespace-nowrap text-[0.6rem] text-muted-foreground sm:pl-3'>
                              {time}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className='grid gap-3'>
                  <div className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'>
                    <h3 className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                      Quick actions
                    </h3>
                    <div className='mt-3 flex flex-col gap-2'>
                      {quickActions.map(({ name, description, icon: Icon, color }) => (
                        <div
                          key={name}
                          className='flex min-h-12 items-center gap-3 rounded-xl border border-border/80 bg-background/80 p-2.5 shadow-sm'
                        >
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${color}`}
                          >
                            <Icon className='size-4' aria-hidden='true' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='truncate text-xs font-semibold text-foreground'>
                              {name}
                            </p>
                            <p className='truncate text-[0.62rem] text-muted-foreground'>
                              {description}
                            </p>
                          </div>
                          <div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-secondary-foreground'>
                            <LuPlus className='size-3' aria-hidden='true' />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'>
                    <div className='flex items-start gap-3'>
                      <div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
                        <LuLifeBuoy className='size-4.5' aria-hidden='true' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='text-xs font-semibold'>Help</h3>
                        <p className='mt-0.5 text-[0.65rem] leading-4 text-muted-foreground'>
                          Get help from the Kytbox team.
                        </p>
                      </div>
                    </div>
                    <div className='mt-3 flex items-center justify-between border-t border-border/60 pt-2.5'>
                      <span className='text-[0.62rem] text-muted-foreground'>Open a support ticket</span>
                      <LuArrowRight className='size-3 text-muted-foreground' aria-hidden='true' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
