/** @vitest-environment jsdom */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PinnedCashflowsSection } from '@/features/cashflow/components/PinnedCashflowsSection'
import type { CashflowWithSummaryDTO } from '@/types/dto'

describe('PinnedCashflowsSection', () => {
  const mockPinnedCashflows: CashflowWithSummaryDTO[] = [
    {
      id: 'cashflow-1',
      title: 'Daily Spending',
      is_public: false,
      user_id: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      entryCount: 42,
      income: 5000,
      expense: 1500,
      balance: 3500,
      isPinned: true,
      isArchived: false,
      isIncluded: true,
    },
    {
      id: 'cashflow-2',
      title: 'Emergency Fund',
      is_public: true,
      user_id: 'user-123',
      created_at: '2026-02-01T00:00:00Z',
      entryCount: 1,
      income: 10000,
      expense: 0,
      balance: 10000,
      isPinned: true,
      isArchived: false,
      isIncluded: true,
    },
  ]

  it('renders null when pinnedCashflows is empty', () => {
    const { container } = render(
      <PinnedCashflowsSection
        pinnedCashflows={[]}
        defaultCurrency='USD'
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders section header and all pinned cards with balance and links', () => {
    render(
      <PinnedCashflowsSection
        pinnedCashflows={mockPinnedCashflows}
        defaultCurrency='USD'
      />,
    )

    // Heading exists
    expect(screen.getByText('Quick Access')).toBeDefined()
    expect(screen.getByText('Quick access to your pinned items and shortcuts.')).toBeDefined()

    // Cards exist
    expect(screen.getByText('Daily Spending')).toBeDefined()
    expect(screen.getByText('42 entries')).toBeDefined()
    expect(screen.getByText('Emergency Fund')).toBeDefined()
    expect(screen.getByText('1 entry')).toBeDefined()

    // Check link to cashflow detail
    const dailySpendingLink = screen.getByRole('link', { name: 'Daily Spending' })
    const emergencyFundLink = screen.getByRole('link', { name: 'Emergency Fund' })
    expect(dailySpendingLink.getAttribute('href')).toBe('/cashflow/cashflow-1')
    expect(emergencyFundLink.getAttribute('href')).toBe('/cashflow/cashflow-2')

    // Check fast entry action button
    const quickLogButtons = screen.getAllByRole('button', { name: /Quick log entry in /i })
    expect(quickLogButtons).toHaveLength(2)
    expect(quickLogButtons[0].getAttribute('aria-label')).toBe('Quick log entry in Daily Spending')
    expect(quickLogButtons[1].getAttribute('aria-label')).toBe('Quick log entry in Emergency Fund')
  })
})
