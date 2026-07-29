import {
  LuActivity,
  LuArrowRight,
  LuBell,
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
    value: '184',
    description: 'Last 7 days',
    icon: LuMousePointerClick,
    color: 'bg-primary/10 text-primary',
  },
  {
    label: 'Cashflow balance',
    value: '$4,280',
    description: 'Current combined balance',
    icon: LuWallet,
    color: 'bg-accent text-accent-foreground',
  },
  {
    label: 'Open items',
    value: '12',
    description: 'Across your lists',
    icon: LuListTodo,
    color: 'bg-secondary text-secondary-foreground',
  },
]

const recentActivity = [
  {
    label: 'Cashflow balance updated',
    source: 'Cashflow',
    value: '$4,280',
    icon: LuWallet,
    color: 'bg-accent text-accent-foreground',
  },
  {
    label: 'New link clicked',
    source: 'Bio',
    value: '+24 clicks',
    icon: LuLink2,
    color: 'bg-primary/10 text-primary',
  },
  {
    label: 'Project checklist updated',
    source: 'List',
    value: '3 items',
    icon: LuListTodo,
    color: 'bg-secondary text-secondary-foreground',
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
    name: 'List',
    description: 'Organize tasks, wishlists, and ideas',
    icon: LuListTodo,
    color: 'bg-secondary text-secondary-foreground',
  },
]

const quickActions = [
  'Add a Bio link',
  'Record a cashflow entry',
  'Create a todo board',
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
                  <p className='mt-2 max-w-md text-xs leading-5 text-muted-foreground'>
                    A clear view of your Bio, Cashflow, and List workspace.
                  </p>
                </div>
                <span className='rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground'>
                  Example workspace
                </span>
              </div>

              <div className='mt-6 grid gap-2 sm:grid-cols-3'>
                {stats.map(
                  ({ label, value, description, icon: Icon, color }) => (
                    <div
                      key={label}
                      className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <span
                          className={[
                            'flex size-7 items-center justify-center rounded-lg',
                            color,
                          ].join(' ')}
                        >
                          <Icon className='size-3.5' aria-hidden='true' />
                        </span>
                        <p className='truncate text-[0.68rem] font-medium text-muted-foreground'>
                          {label}
                        </p>
                      </div>
                      <p className='mt-3 text-xl font-semibold tracking-[-0.04em]'>
                        {value}
                      </p>
                      <p className='mt-1 text-[0.65rem] text-muted-foreground'>
                        {description}
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div className='mt-5 border-t border-border/80 pt-5'>
                <div className='flex items-end justify-between gap-3'>
                  <div>
                    <h3 className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                      Your workspace
                    </h3>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Open a tool when you need it.
                    </p>
                  </div>
                  <span className='font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground/70'>
                    03 active tools
                  </span>
                </div>
                <div className='mt-3 grid gap-2 sm:grid-cols-3'>
                  {appTools.map(({ name, description, icon: Icon, color }) => (
                    <div
                      key={name}
                      className='rounded-2xl border border-border/80 bg-card p-3 shadow-sm'
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <span
                          className={[
                            'flex size-8 items-center justify-center rounded-xl',
                            color,
                          ].join(' ')}
                        >
                          <Icon className='size-4' aria-hidden='true' />
                        </span>
                        <LuArrowRight
                          className='size-3.5 text-muted-foreground'
                          aria-hidden='true'
                        />
                      </div>
                      <p className='mt-4 text-xs font-semibold'>{name}</p>
                      <p className='mt-1 line-clamp-2 text-[0.65rem] leading-4 text-muted-foreground'>
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className='mt-5 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]'>
                <div className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <h3 className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                        Recent activity
                      </h3>
                      <p className='mt-1 text-[0.65rem] text-muted-foreground'>
                        A quick read across your workspace.
                      </p>
                    </div>
                    <LuActivity
                      className='size-4 text-muted-foreground'
                      aria-hidden='true'
                    />
                  </div>
                  <div className='mt-4 grid gap-2'>
                    {recentActivity.map(
                      ({ label, source, value, icon: Icon, color }) => (
                        <div
                          key={label}
                          className='flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background/70 px-2.5 py-2.5'
                        >
                          <span
                            className={[
                              'flex size-7 shrink-0 items-center justify-center rounded-lg',
                              color,
                            ].join(' ')}
                          >
                            <Icon className='size-3.5' aria-hidden='true' />
                          </span>
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-[0.68rem] font-medium'>
                              {label}
                            </p>
                            <p className='mt-0.5 text-[0.6rem] text-muted-foreground'>
                              {source}
                            </p>
                          </div>
                          <span className='shrink-0 font-mono text-[0.6rem] font-semibold text-foreground/70'>
                            {value}
                          </span>
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
                    <div className='mt-3 grid gap-2'>
                      {quickActions.map((action) => (
                        <div
                          key={action}
                          className='flex min-h-9 items-center gap-2 rounded-xl border border-border bg-background px-2.5 text-[0.65rem] font-medium'
                        >
                          <span className='flex size-5 items-center justify-center rounded-md bg-secondary text-secondary-foreground'>
                            <LuPlus className='size-3' aria-hidden='true' />
                          </span>
                          <span className='truncate'>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'>
                    <div className='flex items-center gap-2'>
                      <span className='flex size-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground'>
                        <LuLifeBuoy className='size-3.5' aria-hidden='true' />
                      </span>
                      <h3 className='text-xs font-semibold'>Help</h3>
                    </div>
                    <p className='mt-2 text-[0.65rem] leading-4 text-muted-foreground'>
                      Get help from the Kytbox team.
                    </p>
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
