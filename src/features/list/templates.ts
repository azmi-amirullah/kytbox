export type BoardTemplate = {
  id: TemplateId
  name: string
  description: string
  iconName: string
  colorClass: string
  bgClass: string
  columns: { title: string; is_done_column: boolean }[]
  starterCards: { columnIndex: number; title: string; subtasks?: string[] }[]
}

export const TEMPLATE_IDS = [
  'sprint',
  'content-calendar',
  'weekly-planner',
  'bug-tracker',
  'hiring-pipeline',
  'project-roadmap',
] as const

export type TemplateId = (typeof TEMPLATE_IDS)[number]

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'sprint',
    name: 'Sprint Board',
    description: 'Agile sprints with backlog, active tasks, review, and done.',
    iconName: 'LuZap',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/15',
    columns: [
      { title: 'Backlog', is_done_column: false },
      { title: 'Todo', is_done_column: false },
      { title: 'In Progress', is_done_column: false },
      { title: 'Review', is_done_column: false },
      { title: 'Done', is_done_column: true },
    ],
    starterCards: [
      { columnIndex: 0, title: 'Define sprint goal', subtasks: ['Write acceptance criteria', 'Align with stakeholders'] },
      { columnIndex: 0, title: 'Break down user stories' },
      { columnIndex: 1, title: 'Set up project repo' },
      { columnIndex: 2, title: 'Write API spec' },
    ],
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'Plan, write, edit, and publish content across channels.',
    iconName: 'LuCalendarDays',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/15',
    columns: [
      { title: 'Ideas', is_done_column: false },
      { title: 'Writing', is_done_column: false },
      { title: 'Editing', is_done_column: false },
      { title: 'Scheduled', is_done_column: false },
      { title: 'Published', is_done_column: true },
    ],
    starterCards: [
      { columnIndex: 0, title: 'How-to guide topic brainstorm', subtasks: ['Research keywords', 'Outline key sections'] },
      { columnIndex: 0, title: 'Product launch announcement' },
      { columnIndex: 1, title: 'Monthly newsletter draft' },
      { columnIndex: 2, title: 'Social media captions' },
    ],
  },
  {
    id: 'weekly-planner',
    name: 'Weekly Planner',
    description: 'Organize your week day by day with a done column.',
    iconName: 'LuCalendarCheck',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/15',
    columns: [
      { title: 'Monday', is_done_column: false },
      { title: 'Tuesday', is_done_column: false },
      { title: 'Wednesday', is_done_column: false },
      { title: 'Thursday', is_done_column: false },
      { title: 'Friday', is_done_column: false },
      { title: 'Weekend', is_done_column: false },
      { title: 'Done', is_done_column: true },
    ],
    starterCards: [
      { columnIndex: 0, title: 'Weekly review', subtasks: ['Review last week completions', 'Set priorities for this week'] },
      { columnIndex: 0, title: 'Team standup' },
      { columnIndex: 2, title: 'Mid-week check-in' },
      { columnIndex: 4, title: 'Wrap up & plan next week' },
    ],
  },
  {
    id: 'bug-tracker',
    name: 'Bug Tracker',
    description: 'Track issues from discovery through confirmation to fix.',
    iconName: 'LuBug',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/15',
    columns: [
      { title: 'New', is_done_column: false },
      { title: 'Confirmed', is_done_column: false },
      { title: 'In Progress', is_done_column: false },
      { title: 'Fixed', is_done_column: false },
      { title: 'Closed', is_done_column: true },
    ],
    starterCards: [
      { columnIndex: 0, title: 'Login fails on mobile Safari', subtasks: ['Reproduce on iOS 17', 'Check OAuth redirect URI'] },
      { columnIndex: 0, title: 'Dark mode contrast issue' },
      { columnIndex: 1, title: 'CSV export missing headers' },
      { columnIndex: 2, title: 'Notification not firing on due date' },
    ],
  },
  {
    id: 'hiring-pipeline',
    name: 'Hiring Pipeline',
    description: 'Move candidates from application to offer and beyond.',
    iconName: 'LuUsers',
    colorClass: 'text-teal-500',
    bgClass: 'bg-teal-500/15',
    columns: [
      { title: 'Applied', is_done_column: false },
      { title: 'Phone Screen', is_done_column: false },
      { title: 'Interview', is_done_column: false },
      { title: 'Offer', is_done_column: false },
      { title: 'Hired', is_done_column: true },
      { title: 'Rejected', is_done_column: false },
    ],
    starterCards: [
      { columnIndex: 0, title: 'Frontend Engineer — John D.', subtasks: ['Review portfolio', 'Schedule phone screen'] },
      { columnIndex: 0, title: 'Product Designer — Sarah K.' },
      { columnIndex: 1, title: 'Backend Engineer — Alex M.' },
      { columnIndex: 2, title: 'Full-Stack — Maria T.' },
    ],
  },
  {
    id: 'project-roadmap',
    name: 'Project Roadmap',
    description: 'Track features from planned to shipped on your roadmap.',
    iconName: 'LuMap',
    colorClass: 'text-violet-500',
    bgClass: 'bg-violet-500/15',
    columns: [
      { title: 'Planned', is_done_column: false },
      { title: 'In Progress', is_done_column: false },
      { title: 'Review', is_done_column: false },
      { title: 'Shipped', is_done_column: true },
      { title: 'Backlog', is_done_column: false },
    ],
    starterCards: [
      { columnIndex: 0, title: 'Dark mode support', subtasks: ['Audit color tokens', 'Test all screens in dark mode'] },
      { columnIndex: 0, title: 'Mobile app (Capacitor)' },
      { columnIndex: 1, title: 'Global search (Cmd+K)' },
      { columnIndex: 4, title: 'API access & webhooks' },
    ],
  },
]
