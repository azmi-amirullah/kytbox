export type ChangelogCategory =
  | 'all'
  | 'bio'
  | 'cashflow'
  | 'list'
  | 'platform'
  | 'security'

export type ChangelogItemType = 'feature' | 'improvement' | 'fix' | 'security'

export interface ChangelogItem {
  id: string
  title: string
  description: string
  category: Exclude<ChangelogCategory, 'all'>
  type: ChangelogItemType
  badge?: string
}

export interface ChangelogRelease {
  version: string
  title: string
  date: string
  summary: string
  isLatest?: boolean
  highlights?: string[]
  items: ChangelogItem[]
}

export interface ChangelogFilterOptions {
  category?: ChangelogCategory
  query?: string
}
