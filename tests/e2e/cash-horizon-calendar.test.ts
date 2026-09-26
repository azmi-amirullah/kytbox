import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Cash Horizon calendar regression suite.
 *
 * The existing gates do not reach this component: `accessibility.test.ts`
 * test 5 scans the `/cashflow` hub (no calendar), and the visual baselines
 * capture `fullPage: false` on a detail page where the calendar sits below
 * the fold — it also cannot be baselined directly, because its content is
 * date-dependent and would go stale daily. These assertions pin what would
 * otherwise break silently: cell fit at the 320px floor, the income-above-
 * expense reading order, and axe coverage of the day cells.
 */
const NARROW_WIDTHS = [320, 375, 414]
const WIDE_WIDTHS = [768, 1440]
const DAY_CELL = 'button[aria-label*="Closing balance"]'

async function openDetail(page: Page) {
  await page.goto('/cashflow')
  await page.waitForLoadState('networkidle')
  const cashflowLink = page
    .getByRole('link', { name: /Cashflow|Budget|Book/i })
    .first()

  if (await cashflowLink.isVisible()) {
    await cashflowLink.click()
  } else {
    const runId = Date.now()
    const title = `Calendar Regression ${runId}`
    await page.getByRole('button', { name: /New Cashflow/i }).first().click()
    await page.locator('#title').fill(title)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Create|Save/i })
      .click()
    const createdLink = page.getByRole('link', { name: title }).first()
    await expect(createdLink).toBeVisible({ timeout: 10_000 })
    await createdLink.click()
  }

  await page.waitForURL(/\/cashflow\/[a-f0-9-]{36}/, { timeout: 15_000 })
  await expect(page.locator(DAY_CELL).first()).toBeVisible({
    timeout: 60_000,
  })
  await page.waitForLoadState('networkidle')
}

async function measure(page: Page) {
  return page.evaluate((selector) => {
    const dayButtons = Array.from(document.querySelectorAll(selector))
    let containerWidth = 0
    let minCellHeight = 0
    let clippedCells = 0
    let balanceCount = 0
    let amountCount = 0
    let orderViolations = 0
    const truncated: string[] = []

    for (const btn of dayButtons) {
      const rect = btn.getBoundingClientRect()
      if (minCellHeight === 0 || rect.height < minCellHeight)
        minCellHeight = rect.height
      if (btn.scrollWidth > btn.clientWidth + 1) clippedCells += 1

      const container = btn.closest('[class~="@container"]')
      if (containerWidth === 0 && container instanceof HTMLElement)
        containerWidth = container.clientWidth

      const amounts: string[] = []
      for (const node of btn.querySelectorAll('span')) {
        const el = node instanceof HTMLElement ? node : null
        if (!el || el.clientWidth === 0) continue
        // Wrapper spans concatenate their children's text (hidden tier plus
        // visible tier), so only leaf spans carry a real label.
        if (el.querySelector('span') !== null) continue
        const text = (el.textContent || '').trim()

        if (text.startsWith('+') || text.startsWith('-')) {
          amountCount += 1
          amounts.push(text)
        } else if (!/^\d+$/.test(text)) {
          balanceCount += 1
        }

        if (el.scrollWidth > el.clientWidth + 1) truncated.push(text)
      }

      const income = amounts[0]
      if (amounts.length >= 2 && income !== undefined && !income.startsWith('+'))
        orderViolations += 1
    }

    return {
      containerWidth,
      dayCells: dayButtons.length,
      minCellHeight: Math.round(minCellHeight),
      clippedCells,
      balanceCount,
      amountCount,
      orderViolations,
      truncated,
      pageOverflow:
        document.documentElement.scrollWidth > window.innerWidth + 1,
    }
  }, DAY_CELL)
}

for (const width of NARROW_WIDTHS) {
  test(`Cash Horizon calendar: amounts fit the ${width}px floor`, async ({
    page,
  }) => {
    await openDetail(page)
    await page.setViewportSize({ width, height: 800 })
    await page.waitForTimeout(350)
    const m = await measure(page)

    expect(m.dayCells, `${width}px day cells`).toBeGreaterThan(20)
    expect(m.containerWidth, `${width}px stays in the compact tier`).toBeLessThan(672)
    expect(m.pageOverflow, `${width}px horizontal overflow`).toBe(false)
    expect(m.clippedCells, `${width}px clipped cells`).toBe(0)
    expect(m.truncated, `${width}px truncated text`).toEqual([])
    expect(m.balanceCount, `${width}px hides the overflowing balance`).toBe(0)
    expect(m.amountCount, `${width}px two compact amounts per day`).toBe(
      m.dayCells * 2,
    )
    expect(m.orderViolations, `${width}px income precedes expense`).toBe(0)
    expect(m.minCellHeight, `${width}px touch target`).toBeGreaterThanOrEqual(44)
  })
}

for (const width of WIDE_WIDTHS) {
  test(`Cash Horizon calendar: ${width}px shows full amounts beside the balance`, async ({
    page,
  }) => {
    await openDetail(page)
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(350)
    const m = await measure(page)

    expect(m.dayCells, `${width}px day cells`).toBeGreaterThan(20)
    expect(m.containerWidth, `${width}px is in the full tier`).toBeGreaterThanOrEqual(672)
    expect(m.pageOverflow, `${width}px horizontal overflow`).toBe(false)
    expect(m.clippedCells, `${width}px clipped cells`).toBe(0)
    expect(m.truncated, `${width}px truncated text`).toEqual([])
    expect(m.balanceCount, `${width}px one balance per day`).toBe(m.dayCells)
    expect(m.amountCount, `${width}px two full amounts per day`).toBe(
      m.dayCells * 2,
    )
    expect(m.orderViolations, `${width}px income precedes expense`).toBe(0)
    expect(m.minCellHeight, `${width}px touch target`).toBeGreaterThanOrEqual(44)
  })
}

test('Cash Horizon calendar: axe scan of the day cells', async ({ page }) => {
  await openDetail(page)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast'])
    .exclude('#nprogress')
    .include(DAY_CELL)
    .analyze()

  console.log(
    '[calendar axe] violations =',
    JSON.stringify(results.violations.map((v) => v.id)),
    'nodes =',
    results.violations.reduce((sum, v) => sum + v.nodes.length, 0),
  )
  expect(results.violations).toEqual([])
})
