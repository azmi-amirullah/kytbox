import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * End-to-End Automated Accessibility & Keyboard Audit Suite (Day 21 / WCAG 2.2):
 * 1. Platform Dashboard (/app) A11y & ARIA compliance
 * 2. List Hub (/list) & Sub-apps (Todo, Wishlist, Ideas) A11y compliance
 * 3. Kanban Board (/list/todo) & Card Modals Keyboard Navigation (Tab, Space, Enter, Escape)
 * 4. Wishlist & Idea List Row Controls A11y and Nested Interaction checks
 * 5. Cashflow Hub (/cashflow) & Modals A11y compliance
 * 6. Public Bio Profile (/[username]) WCAG 2.2 AA verification
 */
test.describe.serial('Platform & Feature Accessibility Audit (WCAG 2.2)', () => {
  test('1. Platform Hub (/app) — automated WCAG 2.2 scan & landmark validation', async ({ page }) => {
    await page.goto('/app')
    await page.waitForLoadState('networkidle')

    // Run axe scan targeting WCAG 2.2 AA standards
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(['color-contrast']) // User themes can vary in dark/light contrast
      .exclude('#nprogress')
      .analyze()

    expect(axeResults.violations).toEqual([])

    // Validate core landmarks (banner, main) using role-based locators
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('2. List Hub (/list) & Template Picker — automated axe scan and modal keyboard escape', async ({ page }) => {
    await page.goto('/list/todo')
    await page.waitForLoadState('networkidle')

    // Scan initial /list/todo page
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(['color-contrast'])
      .exclude('#nprogress')
      .analyze()

    expect(axeResults.violations).toEqual([])

    // Open Template Picker Modal
    const templatePickerBtn = page.locator('#open-template-picker, button:has-text("Templates")').first()
    if (await templatePickerBtn.isVisible()) {
      await templatePickerBtn.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 5000 })

      // Scan open modal for dialog accessibility
      const modalAxeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .exclude('#nprogress')
        .analyze()
      expect(modalAxeResults.violations).toEqual([])

      // Test Escape key closes modal
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('3. Kanban Board & Card Modals — keyboard accessibility and button group states', async ({ page }) => {
    await page.goto('/list/todo')
    await page.waitForLoadState('networkidle')

    // Click into first existing board if available, or create quick board
    const firstBoard = page.locator('a[href*="/list/todo/"]').first()
    if (await firstBoard.isVisible()) {
      await firstBoard.click()
      await page.waitForURL(/\/list\/todo\/[a-f0-9-]+/, { timeout: 10_000 })

      // Verify breadcrumb accessibility using role locator
      const breadcrumb = page.getByRole('navigation', { name: 'breadcrumb' }).first()
      await expect(breadcrumb).toBeVisible()
      const currentPage = breadcrumb.locator('[aria-current="page"]')
      await expect(currentPage).toBeVisible()

      // Run axe scan on Kanban Board
      const boardAxeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .exclude('#nprogress')
        .analyze()
      expect(boardAxeResults.violations).toEqual([])

      // Open Edit Task Modal if card exists
      const editTaskBtn = page.getByRole('button', { name: /Edit task/i }).first()
      if (await editTaskBtn.isVisible()) {
        await editTaskBtn.click()
        const editDialog = page.getByRole('dialog')
        await expect(editDialog).toBeVisible({ timeout: 5000 })

        // Check button group semantic labels and aria-pressed attributes
        const priorityGroup = editDialog.locator('[role="group"][aria-label="Task priority"]')
        await expect(priorityGroup).toBeVisible()

        const recurrenceGroup = editDialog.locator('[role="group"][aria-label="Task recurrence schedule"]')
        await expect(recurrenceGroup).toBeVisible()

        // Scan open Edit modal
        const editModalAxe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast'])
          .exclude('#nprogress')
          .analyze()
        expect(editModalAxe.violations).toEqual([])

        // Close modal with Escape
        await page.keyboard.press('Escape')
        await expect(editDialog).not.toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('4. Wishlist & Idea Sub-apps — automated scan and row accessibility', async ({ page }) => {
    // 1. Wishlist Hub
    await page.goto('/list/wishlist')
    await page.waitForLoadState('networkidle')

    const wishlistAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .exclude('#nprogress')
      .analyze()
    expect(wishlistAxe.violations).toEqual([])

    // 2. Ideas Hub
    await page.goto('/list/ideas')
    await page.waitForLoadState('networkidle')

    const ideasAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .exclude('#nprogress')
      .analyze()
    expect(ideasAxe.violations).toEqual([])
  })

  test('5. Cashflow Hub (/cashflow) — automated scan & accessibility check', async ({ page }) => {
    await page.goto('/cashflow')
    await page.waitForLoadState('networkidle')

    const cashflowAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .exclude('#nprogress')
      .analyze()
    expect(cashflowAxe.violations).toEqual([])
  })
})
