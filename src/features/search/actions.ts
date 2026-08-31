'use server'

import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { formatAppDate } from '@/lib/date-only'
import type { GlobalSearchResult, SearchResultItem } from './types'

const searchQuerySchema = z.string().trim().min(2).max(100)

function getListIcon(type: string): SearchResultItem['icon'] {
  if (type === 'wishlist') return 'wishlist'
  if (type === 'ideas') return 'idea'
  return 'todo'
}

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const parsed = searchQuerySchema.safeParse(query)
  if (!parsed.success) {
    return { bio: [], cashflow: [], list: [], support: [], invoice: [] }
  }

  const { user, supabase } = await getAuthenticatedUser()
  const term = `%${parsed.data}%`

  // Pre-fetch owned cashflow and list IDs and titles for join filtering and contextual subtitles
  const [cashflowResult, listInfoResult] = await Promise.all([
    supabase
      .from('cashflows')
      .select('id, title')
      .eq('user_id', user.id),
    supabase
      .from('lists')
      .select('id, title, type')
      .eq('user_id', user.id),
  ])

  const cashflowRows = cashflowResult.data ?? []
  const cashflowIds = cashflowRows.map((c) => c.id)
  const cashflowTitleById = new Map(cashflowRows.map((c) => [c.id, c.title]))

  const listRows = listInfoResult.data ?? []
  const listIds = listRows.map((l) => l.id)
  const listTypeById = new Map(listRows.map((l) => [l.id, l.type]))
  const listTitleById = new Map(listRows.map((l) => [l.id, l.title]))

  // Parallel search across all domains
  const [bioResult, cashflowEntriesResult, goalResult, listResult, supportResult, invoiceResult] =
    await Promise.all([
      supabase
        .from('links')
        .select('id, title, url')
        .eq('user_id', user.id)
        .ilike('title', term)
        .limit(5),
      cashflowIds.length > 0
        ? supabase
            .from('cashflow_entries')
            .select('id, cashflow_id, description, category, amount, type, date')
            .in('cashflow_id', cashflowIds)
            .is('goal_id', null)
            .ilike('description', term)
            .order('date', { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      cashflowIds.length > 0
        ? supabase
            .from('cashflow_goals')
            .select('id, cashflow_id, title, target_amount, deadline')
            .in('cashflow_id', cashflowIds)
            .eq('is_deleted', false)
            .ilike('title', term)
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      listIds.length > 0
        ? supabase
            .from('list_items')
            .select('id, list_id, title')
            .in('list_id', listIds)
            .ilike('title', term)
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('support_tickets')
        .select('id, subject, status')
        .eq('user_id', user.id)
        .ilike('subject', term)
        .limit(5),
      supabase
        .from('invoices')
        .select('id, invoice_number, client_name, total_amount, currency, status')
        .eq('user_id', user.id)
        .or(`client_name.ilike.${term},invoice_number.ilike.${term}`)
        .limit(5),
    ])

  const bio: SearchResultItem[] = (bioResult.data ?? []).map((link) => ({
    id: link.id,
    title: link.title,
    subtitle: link.url,
    href: `/bio?q=${encodeURIComponent(link.title)}`,
    category: 'bio' as const,
    icon: 'link' as const,
  }))

  const cashflowEntries: SearchResultItem[] = (cashflowEntriesResult.data ?? []).map(
    (entry) => {
      const bookTitle = cashflowTitleById.get(entry.cashflow_id)
      const bookStr = bookTitle ? `${bookTitle} · ` : ''
      const dateStr = entry.date ? ` · ${formatAppDate(entry.date)}` : ''
      const categoryStr = entry.category ? ` · ${entry.category}` : ''
      const sign = entry.type === 'income' ? '+' : '-'

      return {
        id: entry.id,
        title: entry.description,
        subtitle: `${bookStr}${sign}${entry.amount}${categoryStr}${dateStr}`,
        href: `/cashflow/${entry.cashflow_id}?q=${encodeURIComponent(entry.description)}`,
        category: 'cashflow' as const,
        icon: 'wallet' as const,
      }
    },
  )

  const cashflowGoals: SearchResultItem[] = (goalResult.data ?? []).map(
    (goal) => {
      const bookTitle = cashflowTitleById.get(goal.cashflow_id)
      const bookStr = bookTitle ? `${bookTitle} · ` : ''
      const deadlineStr = goal.deadline ? ` · Due ${formatAppDate(goal.deadline)}` : ''
      return {
        id: goal.id,
        title: goal.title,
        subtitle: `${bookStr}Savings Goal · Target ${goal.target_amount}${deadlineStr}`,
        href: `/cashflow/goal/${goal.id}`,
        category: 'cashflow' as const,
        icon: 'target' as const,
      }
    },
  )

  const cashflow = [...cashflowGoals, ...cashflowEntries].slice(0, 8)

  const list: SearchResultItem[] = (listResult.data ?? []).map((item) => {
    const type = listTypeById.get(item.list_id) ?? 'todo'
    const listTitle = listTitleById.get(item.list_id)
    const listStr = listTitle ? `${listTitle} · ` : ''
    return {
      id: item.id,
      title: item.title,
      subtitle: `${listStr}${type.charAt(0).toUpperCase() + type.slice(1)}`,
      href: `/list/${type}/${item.list_id}`,
      category: 'list' as const,
      icon: getListIcon(type),
    }
  })

  const support: SearchResultItem[] = (supportResult.data ?? []).map(
    (ticket) => ({
      id: ticket.id,
      title: ticket.subject,
      subtitle: ticket.status ?? 'open',
      href: `/support/${ticket.id}`,
      category: 'support' as const,
      icon: 'ticket' as const,
    }),
  )

  const invoice: SearchResultItem[] = (invoiceResult.data ?? []).map(
    (inv) => ({
      id: inv.id,
      title: inv.client_name,
      subtitle: `${inv.invoice_number} · ${inv.currency} ${inv.total_amount} · ${inv.status}`,
      href: `/invoice?q=${encodeURIComponent(inv.invoice_number)}`,
      category: 'invoice' as const,
    }),
  )

  return { bio, cashflow, list, support, invoice }
}
