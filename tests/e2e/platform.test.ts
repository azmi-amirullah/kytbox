import { test, expect } from '@playwright/test'

const runId = Date.now()

/**
 * ============================================================================
 * Platform Domain E2E Test Suite
 * ============================================================================
 * 1. Workspace Global Search (`Cmd+K` / `Ctrl+K`)
 *    - Trigger via UI header button and keyboard shortcut
 *    - Debounced query execution against multi-domain search API
 *    - Category grouping and navigation item rendering
 *    - Keyboard selection & direct route redirection
 *    - Empty state handling
 *
 * 2. One-Click GDPR Data Export
 *    - Settings page export card presence
 *    - Download trigger initiating `/api/user/export`
 *    - Stream response verification with `application/zip` and `kytbox-export-[date].zip` headers
 */
test.describe.serial('Platform Domain E2E Suite', () => {
  test.setTimeout(60_000)

  // --------------------------------------------------------------------------
  // 1. Workspace Global Search (Cmd+K)
  // --------------------------------------------------------------------------
  test('1.1 Workspace global search (Cmd+K) — palette trigger, query, navigation, and empty state', async ({ page }) => {
    await page.goto('/app')

    // 1. Open via UI Search Trigger in header
    const searchTrigger = page.locator('#tour-search-trigger')
    await expect(searchTrigger).toBeVisible({ timeout: 10_000 })
    await searchTrigger.click()

    const commandDialog = page.getByRole('dialog')
    await expect(commandDialog).toBeVisible({ timeout: 5000 })

    const searchInput = commandDialog.getByPlaceholder('Search across workspace...')
    await expect(searchInput).toBeVisible()

    // Verify default static navigation items
    await expect(commandDialog.getByText('Bio Dashboard', { exact: true })).toBeVisible()
    await expect(commandDialog.getByText('Cashflow', { exact: true })).toBeVisible()
    await expect(commandDialog.getByText('List Hub', { exact: true })).toBeVisible()

    // Close via Escape key
    await page.keyboard.press('Escape')
    await expect(commandDialog).not.toBeVisible({ timeout: 5000 })

    // Re-open via Keyboard Shortcut (Control+k)
    await page.keyboard.press('Control+k')
    await expect(commandDialog).toBeVisible({ timeout: 5000 })

    // Navigate to Cashflow via search selection
    await searchInput.fill('Cashflow')
    const cashflowNavItem = commandDialog.getByRole('option', { name: /Cashflow/i }).first()
    await expect(cashflowNavItem).toBeVisible({ timeout: 5000 })
    await cashflowNavItem.click()

    await page.waitForURL(/.*\/cashflow/, { timeout: 15_000 })
    await expect(commandDialog).not.toBeVisible({ timeout: 5000 })

    // Test dynamic empty state on /cashflow
    await page.keyboard.press('Control+k')
    await expect(commandDialog).toBeVisible({ timeout: 5000 })
    const activeSearchInput = commandDialog.getByPlaceholder('Search across workspace...')

    await activeSearchInput.fill(`nonexistent_query_${runId}`)
    await expect(commandDialog.getByText('No results found.')).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('Escape')
    await expect(commandDialog).not.toBeVisible({ timeout: 5000 })
  })

  // --------------------------------------------------------------------------
  // 2. One-Click GDPR Data Export
  // --------------------------------------------------------------------------
  test('2.1 One-click GDPR data export — initiates zip stream with valid archive headers', async ({ page }) => {
    await page.goto('/settings')

    const exportCard = page.locator('div').filter({ hasText: /Export Workspace Data/i }).first()
    await expect(exportCard).toBeVisible({ timeout: 10_000 })

    const exportBtn = page.getByRole('button', { name: /Export All Data \(ZIP\)/i })
    await expect(exportBtn).toBeVisible({ timeout: 10_000 })

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/user/export') && (res.status() === 200 || res.status() === 429),
        { timeout: 30_000 },
      ),
      exportBtn.click(),
    ])

    if (response.status() === 200) {
      const contentType = response.headers()['content-type']
      const contentDisposition = response.headers()['content-disposition']

      expect(contentType).toContain('application/zip')
      expect(contentDisposition).toMatch(/attachment;\s*filename="kytbox-export-.*\.zip"/)
    } else {
      expect(response.status()).toBe(429)
      await expect(page.getByText(/Too many export requests/i)).toBeVisible({ timeout: 5000 })
    }
  })

  // --------------------------------------------------------------------------
  // 3. Public Changelog & What's New System
  // --------------------------------------------------------------------------
  test('3.1 Public changelog (/changelog) — renders release timeline, category tabs, and live search filter', async ({ page }) => {
    await page.goto('/changelog')

    // 1. Verify Page Heading & Meta Presence
    const heading = page.getByRole('heading', { level: 1, name: /What's New in Kytbox/i })
    await expect(heading).toBeVisible({ timeout: 10_000 })

    // Verify v2.0.0 Latest Release is displayed
    await expect(page.getByText(/v2.0.0/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Cashflow Bulk Actions Engine/i)).toBeVisible()

    // 2. Category Tab Filtering
    const bioTab = page.getByRole('tab', { name: /Bio/i })
    await expect(bioTab).toBeVisible()
    await bioTab.click()

    // When filtered by Bio, Cashflow-specific Bulk Actions should not be visible
    await expect(page.getByText(/Cashflow Bulk Actions Engine/i)).not.toBeVisible()
    await expect(page.getByText(/Custom Domain Mapping Engine/i)).toBeVisible()

    // Switch to Cashflow Tab
    const cashflowTab = page.getByRole('tab', { name: /Cashflow/i })
    await cashflowTab.click()
    await expect(page.getByText(/Cashflow Bulk Actions Engine/i)).toBeVisible()
    await expect(page.getByText(/Custom Domain Mapping Engine/i)).not.toBeVisible()

    // Switch back to All Updates
    const allTab = page.getByRole('tab', { name: /All Updates/i })
    await allTab.click()
    await expect(page.getByText(/Cashflow Bulk Actions Engine/i)).toBeVisible()
    await expect(page.getByText(/Custom Domain Mapping Engine/i)).toBeVisible()

    // 3. Live Search Filtering
    const searchInput = page.getByPlaceholder('Search release notes...')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('GDPR')

    await expect(page.getByText(/One-Click GDPR Data Export/i)).toBeVisible()
    await expect(page.getByText(/Custom Domain Mapping Engine/i)).not.toBeVisible()

    // Empty state handling
    await searchInput.fill(`nonexistent_feature_${runId}`)
    await expect(page.getByText(/No matching updates found/i)).toBeVisible({ timeout: 5000 })

    // Reset via reset button
    const resetBtn = page.getByRole('button', { name: /Reset all filters/i })
    await expect(resetBtn).toBeVisible()
    await resetBtn.click()

    await expect(page.getByText(/Cashflow Bulk Actions Engine/i)).toBeVisible()
  })

  test('3.2 In-app What\'s New modal — manual trigger via event and dismissal', async ({ page }) => {
    await page.goto('/app')

    // Trigger the modal via custom event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-whats-new'))
    })

    const whatsNewDialog = page.getByRole('dialog')
    await expect(whatsNewDialog).toBeVisible({ timeout: 5000 })
    await expect(whatsNewDialog.getByText(/What's New in Kytbox/i).first()).toBeVisible()
    await expect(whatsNewDialog.getByText(/v2.0.0/i).first()).toBeVisible()

    // Click "Got It" button to dismiss
    const gotItBtn = whatsNewDialog.getByRole('button', { name: /Got It/i })
    await expect(gotItBtn).toBeVisible()
    await gotItBtn.click()

    await expect(whatsNewDialog).not.toBeVisible({ timeout: 5000 })
  })
})
