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

async function openDetail(page: Page, fresh = false) {
  await page.goto('/cashflow')
  await page.waitForLoadState('networkidle')
  const cashflowLink = page
    .getByRole('link', { name: /Cashflow|Budget|Book/i })
    .first()

  if (!fresh && (await cashflowLink.isVisible())) {
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
    let blankViolations = 0
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

      // The aria-label encodes whether the day carries entries: "2 item(s):"
      // means amounts must render, "No transactions." means they must not.
      const label = btn.getAttribute('aria-label') ?? ''
      const expectedAmounts = label.includes('item(s)') ? 2 : 0
      if (amounts.length !== expectedAmounts) blankViolations += 1
    }

    return {
      containerWidth,
      dayCells: dayButtons.length,
      minCellHeight: Math.round(minCellHeight),
      clippedCells,
      balanceCount,
      amountCount,
      orderViolations,
      blankViolations,
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
    expect(m.blankViolations, `${width}px amounts render iff day has events`).toBe(0)
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
    expect(m.blankViolations, `${width}px amounts render iff day has events`).toBe(0)
    expect(m.orderViolations, `${width}px income precedes expense`).toBe(0)
    expect(m.minCellHeight, `${width}px touch target`).toBeGreaterThanOrEqual(44)
  })
}

/**
 * The seeded cashflow never goes at-risk (positive balance, hardcoded
 * threshold 0), so the marker is otherwise untested. An empty cashflow
 * projects a 0 balance on every day, which satisfies `balance <= 0` and
 * lights the marker up across the whole grid.
 */
test('Cash Horizon calendar: at-risk marker stays on the date line', async ({
  page,
}) => {
  await openDetail(page, true)

  for (const width of [320, 375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(350)
    const m = await page.evaluate((selector) => {
      const dayButtons = Array.from(document.querySelectorAll(selector))
      let inDateRow = 0
      let outsideDateRow = 0
      let sameLine = 0
      let clippedCells = 0

      for (const btn of dayButtons) {
        if (btn.scrollWidth > btn.clientWidth + 1) clippedCells += 1

        const dateRow = btn.firstElementChild
        const icons = btn.querySelectorAll('svg')

        if (dateRow instanceof Element) {
          const dateRowIcons = dateRow.querySelectorAll('svg')
          if (icons.length === 1 && dateRowIcons.length === 1) {
            inDateRow += 1
            const pill = dateRow.firstElementChild
            const icon = dateRowIcons.item(0)
            if (
              pill instanceof HTMLElement &&
              icon !== null &&
              Math.abs(
                pill.getBoundingClientRect().top -
                  icon.getBoundingClientRect().top,
              ) < 12
            ) {
              sameLine += 1
            }
            continue
          }
        }
        outsideDateRow += 1
      }

      return {
        cells: dayButtons.length,
        inDateRow,
        outsideDateRow,
        sameLine,
        clippedCells,
        pageOverflow:
          document.documentElement.scrollWidth > window.innerWidth + 1,
      }
    }, DAY_CELL)

    expect(m.cells, `${width}px day cells`).toBeGreaterThan(20)
    expect(m.inDateRow, `${width}px marker lives in the date row`).toBe(
      m.cells,
    )
    expect(m.outsideDateRow, `${width}px marker never leaves the date row`).toBe(
      0,
    )
    expect(m.clippedCells, `${width}px clipped cells`).toBe(0)
    expect(m.pageOverflow, `${width}px horizontal overflow`).toBe(false)
    // A 35px cell at 320px cannot hold the 20px date pill and the marker
    // side by side, so the floor wraps rather than overflows.
    if (width >= 375) {
      expect(m.sameLine, `${width}px marker inline with the date number`).toBe(
        m.cells,
      )
    }
  }
})

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
