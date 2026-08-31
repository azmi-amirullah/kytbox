export interface SearchResultItem {
  id: string
  title: string
  subtitle: string | null
  href: string
  category: 'bio' | 'cashflow' | 'list' | 'support' | 'invoice'
  icon?: 'wallet' | 'target' | 'link' | 'list' | 'ticket' | 'invoice' | 'idea' | 'wishlist' | 'todo'
}

export interface GlobalSearchResult {
  bio: SearchResultItem[]
  cashflow: SearchResultItem[]
  list: SearchResultItem[]
  support: SearchResultItem[]
  invoice: SearchResultItem[]
}
