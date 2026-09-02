import { describe, it, expect } from 'vitest'
import {
  getChangelogReleases,
  getLatestRelease,
  filterChangelog,
} from '@/features/platform/data/changelog'
import type { ChangelogRelease } from '@/features/platform/types'

describe('Platform Changelog Domain Unit Tests', () => {
  describe('Release Data Integrity', () => {
    it('should have well-formed releases in descending version/chronological order', () => {
      const releases = getChangelogReleases()
      expect(releases.length).toBeGreaterThanOrEqual(4)

      // Verify date format & descending order
      for (let i = 0; i < releases.length - 1; i++) {
        const currentDate = new Date(releases[i].date).getTime()
        const nextDate = new Date(releases[i + 1].date).getTime()
        expect(currentDate).toBeGreaterThanOrEqual(nextDate)
      }
    })

    it('should have exactly one release marked as latest', () => {
      const releases = getChangelogReleases()
      const latestReleases = releases.filter((r) => r.isLatest)
      expect(latestReleases).toHaveLength(1)
      expect(latestReleases[0].version).toBe('2.0.0')

      const resolvedLatest = getLatestRelease()
      expect(resolvedLatest.version).toBe('2.0.0')
    })

    it('should contain valid items with unique IDs, non-empty fields and allowed categories', () => {
      const releases = getChangelogReleases()
      const seenIds = new Set<string>()
      const allowedCategories = ['bio', 'cashflow', 'list', 'platform', 'security']
      const allowedTypes = ['feature', 'improvement', 'fix', 'security']

      releases.forEach((rel) => {
        expect(rel.version).toBeTruthy()
        expect(rel.title).toBeTruthy()
        expect(rel.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(rel.summary).toBeTruthy()
        expect(rel.items.length).toBeGreaterThan(0)

        rel.items.forEach((item) => {
          expect(item.id).toBeTruthy()
          expect(seenIds.has(item.id)).toBe(false)
          seenIds.add(item.id)

          expect(item.title).toBeTruthy()
          expect(item.description).toBeTruthy()
          expect(allowedCategories).toContain(item.category)
          expect(allowedTypes).toContain(item.type)
        })
      })
    })
  })

  describe('filterChangelog', () => {
    const mockReleases: ChangelogRelease[] = [
      {
        version: '2.0.0',
        title: 'Platform Major Release',
        date: '2026-08-30',
        summary: 'Major release with search and export',
        isLatest: true,
        items: [
          {
            id: 'item-1',
            title: 'Global Search',
            description: 'Fast Cmd+K search across workspace',
            category: 'platform',
            type: 'feature',
          },
          {
            id: 'item-2',
            title: 'Bulk Actions',
            description: 'Batch edit transactions in cashflow',
            category: 'cashflow',
            type: 'feature',
          },
        ],
      },
      {
        version: '1.9.0',
        title: 'List Tasks Upgrade',
        date: '2026-08-20',
        summary: 'Kanban checklists and priorities',
        isLatest: false,
        items: [
          {
            id: 'item-3',
            title: 'Subtasks Engine',
            description: 'Checklist progress on cards',
            category: 'list',
            type: 'feature',
          },
        ],
      },
    ]

    it('returns all releases when filter is empty or all', () => {
      expect(filterChangelog(mockReleases)).toEqual(mockReleases)
      expect(filterChangelog(mockReleases, { category: 'all' })).toEqual(mockReleases)
      expect(filterChangelog(mockReleases, { category: 'all', query: '   ' })).toEqual(mockReleases)
    })

    it('filters releases and items strictly by category', () => {
      const platformOnly = filterChangelog(mockReleases, { category: 'platform' })
      expect(platformOnly).toHaveLength(1)
      expect(platformOnly[0].version).toBe('2.0.0')
      expect(platformOnly[0].items).toHaveLength(1)
      expect(platformOnly[0].items[0].id).toBe('item-1')

      const listOnly = filterChangelog(mockReleases, { category: 'list' })
      expect(listOnly).toHaveLength(1)
      expect(listOnly[0].version).toBe('1.9.0')
      expect(listOnly[0].items).toHaveLength(1)
      expect(listOnly[0].items[0].id).toBe('item-3')

      const bioOnly = filterChangelog(mockReleases, { category: 'bio' })
      expect(bioOnly).toHaveLength(0)
    })

    it('filters releases by search query matching titles, descriptions, or summaries', () => {
      const searchResults = filterChangelog(mockReleases, { query: 'cmd+k' })
      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].version).toBe('2.0.0')
      expect(searchResults[0].items).toHaveLength(1)
      expect(searchResults[0].items[0].title).toBe('Global Search')

      const summaryResults = filterChangelog(mockReleases, { query: 'kanban' })
      expect(summaryResults).toHaveLength(1)
      expect(summaryResults[0].version).toBe('1.9.0')
    })

    it('combines category and query filters accurately', () => {
      // Matches query but wrong category
      const mismatch = filterChangelog(mockReleases, { category: 'list', query: 'Cmd+K' })
      expect(mismatch).toHaveLength(0)

      // Matches both category and query
      const match = filterChangelog(mockReleases, { category: 'platform', query: 'Search' })
      expect(match).toHaveLength(1)
      expect(match[0].items[0].title).toBe('Global Search')
    })
  })
})
