import { test, expect } from '@playwright/test'

const runId = Date.now()
const cashflowTitle = `E2E Cashflow Advanced ${runId}`
let cashflowUrl: string

/**
 * End-to-End Test Suite for Week 2 Cashflow Power Features (Day 13):
 * 1. Split Transactions Engine (Breakdown line items, auto-sum calculation, persistence)
 * 2. Custom Tags & Labels Engine (Multi-tag assignment, toolbar filtering, ManageTagModal rename)
 * 3. Receipt & Photo Attachment Upload (Upload pipeline, row badge, ReceiptLightbox viewer)
 * 4. CSV Bank Import & Auto-Parser (File upload, column mapping, preview, batch import)
 * 5. Monthly Comparison View (Compare Months tab, Month A vs B swap, Delta KPI cards, category diffs)
 */
test.describe.serial('Cashflow Advanced Features E2E', () => {
  test.setTimeout(60_000)

  test('1. Split Transactions Engine — breakdown line items and auto-sum total', async ({ page }) => {
    // 1. Create cashflow book
    await page.goto('/cashflow')
    await page.getByRole('button', { name: /New Cashflow/i }).first().click()

    await page.locator('#title').fill(cashflowTitle)
    await page.getByRole('dialog').getByRole('button', { name: /Create|Save/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    const cashflowLink = page.getByRole('link', { name: cashflowTitle }).first()
    await expect(cashflowLink).toBeVisible({ timeout: 10_000 })
    await cashflowLink.click()

    await page.waitForURL(/\/cashflow\/[a-f0-9-]{36}/, { timeout: 15_000 })
    await expect(page.getByText(cashflowTitle).first()).toBeVisible({ timeout: 10_000 })
    cashflowUrl = page.url()

    // 2. Open Add Entry modal and enable Split Toggle
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(`Supermarket Split ${runId}`)

    // Toggle Transaction Breakdown
    const splitToggle = dialog.locator('#split-toggle')
    await splitToggle.click()

    // Add Split Item 1: Groceries ($70)
    await dialog.getByRole('button', { name: /Add Item/i }).click()
    const item1Name = dialog.locator('input[placeholder*="Item 1 name"]')
    await item1Name.fill('Groceries')
    const item1Amount = dialog.locator('input[type="number"][placeholder="0.00"]').first()
    await item1Amount.fill('70')

    // Add Split Item 2: Cleaning Supplies ($30)
    await dialog.getByRole('button', { name: /Add Item/i }).click()
    const item2Name = dialog.locator('input[placeholder*="Item 2 name"]')
    await item2Name.fill('Cleaning Supplies')
    const item2Amount = dialog.locator('input[type="number"][placeholder="0.00"]').nth(1)
    await item2Amount.fill('30')

    // Verify parent amount input is disabled and reflects auto-calculated sum ($100.00)
    const parentAmount = dialog.locator('#amount')
    await expect(parentAmount).toBeDisabled()
    await expect(parentAmount).toHaveValue('100.00')

    // Save Entry
    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    // Verify entry in table with split badge (2 items)
    const row = page.locator('tr, div.group').filter({ hasText: `Supermarket Split ${runId}` }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await expect(row.getByText(/2 items/i)).toBeVisible({ timeout: 10_000 })
    await expect(row.getByText(/100/)).toBeVisible({ timeout: 10_000 })

    // Reopen edit modal and verify breakdown items are preserved
    await row.getByRole('button').first().click()
    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible()
    await expect(editDialog.locator('input[placeholder*="Item 1 name"]')).toHaveValue('Groceries')
    await expect(editDialog.locator('input[placeholder*="Item 2 name"]')).toHaveValue('Cleaning Supplies')
    await editDialog.getByRole('button', { name: /Cancel|Close/i }).first().click()
  })

  test('2. Custom Tags & Labels Engine — assignment, toolbar filtering, and tag renaming', async ({ page }) => {
    await page.goto(cashflowUrl)

    // 1. Add Entry A with tags #TaxDeductible and #ProjectAlpha
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(`Consulting Invoice ${runId}`)
    await dialog.locator('#amount').fill('250')

    // Type and press Enter in TagPicker input
    const tagInput = dialog.getByRole('combobox', { name: /Add tag/i })
    await tagInput.fill('TaxDeductible')
    await tagInput.press('Enter')
    await tagInput.fill('ProjectAlpha')
    await tagInput.press('Enter')

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    // 2. Add Entry B with tag #Personal
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(`Personal Coffee ${runId}`)
    await dialog.locator('#amount').fill('15')

    const tagInput2 = dialog.getByRole('combobox', { name: /Add tag/i })
    await tagInput2.fill('Personal')
    await tagInput2.press('Enter')

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    // 3. Verify Tag Badges in table rows
    const rowA = page.locator('tr, div.group').filter({ hasText: `Consulting Invoice ${runId}` }).first()
    await expect(rowA.getByText('#TaxDeductible')).toBeVisible({ timeout: 10_000 })
    await expect(rowA.getByText('#ProjectAlpha')).toBeVisible({ timeout: 10_000 })

    const rowB = page.locator('tr, div.group').filter({ hasText: `Personal Coffee ${runId}` }).first()
    await expect(rowB.getByText('#Personal')).toBeVisible({ timeout: 10_000 })

    // 4. Test Toolbar Tag Filter Strip
    const tagFilterButton = page.getByRole('button', { name: '#TaxDeductible' }).first()
    await expect(tagFilterButton).toBeVisible({ timeout: 10_000 })
    await tagFilterButton.click()

    // Assert only Entry A is visible, Entry B is filtered out
    await expect(page.locator('tr, div.group').filter({ hasText: `Consulting Invoice ${runId}` })).toBeVisible()
    await expect(page.locator('tr, div.group').filter({ hasText: `Personal Coffee ${runId}` })).not.toBeVisible()

    // Reset tag filter
    const resetTagsButton = page.getByRole('button', { name: /Reset tags/i })
    if (await resetTagsButton.isVisible()) {
      await resetTagsButton.click()
    } else {
      await tagFilterButton.click()
    }
    await expect(page.locator('tr, div.group').filter({ hasText: `Personal Coffee ${runId}` })).toBeVisible({ timeout: 10_000 })

    // 5. Test ManageTagModal: Rename #TaxDeductible -> #TaxAudit2026
    // Hover over tag badge in filter strip to reveal and wait for manage button transition
    const manageTagBtn = page.getByRole('button', { name: 'Manage tag TaxDeductible' }).first()
    await tagFilterButton.hover()
    await expect(manageTagBtn).toBeVisible({ timeout: 5000 })
    await manageTagBtn.click()

    const manageModal = page.getByRole('dialog').filter({ hasText: /Manage Tag/i })
    await expect(manageModal).toBeVisible({ timeout: 5000 })

    const tagNameInput = manageModal.locator('#tag-name')
    await tagNameInput.fill('TaxAudit2026')
    await manageModal.getByRole('button', { name: /Save Changes/i }).click()
    await expect(manageModal).not.toBeVisible({ timeout: 10_000 })

    // Assert renamed tag badge is present
    await expect(page.getByText('#TaxAudit2026').first()).toBeVisible({ timeout: 10_000 })
  })

  test('3. Receipt & Attachment Upload — image upload and ReceiptLightbox preview', async ({ page }) => {
    await page.goto(cashflowUrl)

    // 1. Open Add Entry modal
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(`Business Lunch with Receipt ${runId}`)
    await dialog.locator('#amount').fill('85.50')

    // 2. Upload in-memory image buffer (1x1 PNG)
    const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const fileInput = dialog.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'receipt-lunch.png',
      mimeType: 'image/png',
      buffer: Buffer.from(samplePngBase64, 'base64'),
    })

    // Verify thumbnail preview renders in modal
    await expect(dialog.getByText(/receipt-lunch\.png/i)).toBeVisible({ timeout: 5000 })

    // Save Entry
    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 15_000 })

    // 3. Verify Receipt Badge in table row
    const row = page.locator('tr, div.group').filter({ hasText: `Business Lunch with Receipt ${runId}` }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })

    const receiptBadge = row.getByRole('button', { name: /View receipt attachment|Receipt/i }).first()
    await expect(receiptBadge).toBeVisible({ timeout: 10_000 })

    // 4. Open Receipt Lightbox
    await receiptBadge.click()
    const lightbox = page.getByRole('dialog').filter({ hasText: /Receipt/i })
    await expect(lightbox).toBeVisible({ timeout: 10_000 })

    // Verify Zoom In control
    const zoomInBtn = lightbox.getByRole('button', { name: /Zoom In/i }).or(lightbox.locator('button[title*="Zoom In"]'))
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click()
    }

    // Close Lightbox
    const closeLightboxBtn = lightbox.getByRole('button', { name: /Close/i }).first()
    if (await closeLightboxBtn.isVisible()) {
      await closeLightboxBtn.click()
    } else {
      await page.keyboard.press('Escape')
    }
    await expect(lightbox).not.toBeVisible({ timeout: 5000 })
  })

  test('4. CSV Bank Import & Auto-Parser — upload, mapping, preview, and batch import', async ({ page }) => {
    await page.goto(cashflowUrl)

    // 1. Click Import CSV in header
    const importBtn = page.getByRole('button', { name: /Import CSV/i }).first()
    await expect(importBtn).toBeVisible({ timeout: 10_000 })
    await importBtn.click()

    const importModal = page.getByRole('dialog', { name: /Import.*Transactions/i })
    await expect(importModal).toBeVisible({ timeout: 5000 })

    // 2. Upload CSV buffer
    const csvContent = [
      'Date,Description,Amount,Type,Category',
      '2026-08-01,Client Project Fee,1200.00,income,salary',
      '2026-08-02,Cloud Server Hosting,85.00,expense,utilities',
      '2026-08-03,Office Stationery,42.50,expense,general',
    ].join('\n')

    const csvFileInput = importModal.locator('input[type="file"]')
    await csvFileInput.setInputFiles({
      name: 'bank-statement-august.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    })

    // Step 2: Mapping Step should auto-load
    await expect(importModal.getByText(/Date Column/i)).toBeVisible({ timeout: 10_000 })
    await expect(importModal.getByText(/3 rows found/i)).toBeVisible({ timeout: 10_000 })

    // Click Preview Transactions
    const previewBtn = importModal.getByRole('button', { name: /Preview Transactions/i })
    await expect(previewBtn).toBeVisible()
    await previewBtn.click()

    // Step 3: Preview Table
    await expect(importModal.getByText('Client Project Fee')).toBeVisible({ timeout: 10_000 })
    await expect(importModal.getByText('Cloud Server Hosting')).toBeVisible({ timeout: 10_000 })

    // Confirm Import
    const confirmImportBtn = importModal.getByRole('button', { name: /Import 3 Transactions/i })
    await expect(confirmImportBtn).toBeVisible()
    await confirmImportBtn.click()

    await expect(importModal).not.toBeVisible({ timeout: 15_000 })

    // Verify imported entries in table
    await expect(page.getByText('Client Project Fee').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Cloud Server Hosting').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Office Stationery').first()).toBeVisible({ timeout: 15_000 })
  })

  test('5. Monthly Comparison View — month selection, swap, delta KPI cards, and category diffs', async ({ page }) => {
    await page.goto(cashflowUrl)

    // 1. Add a transaction in July so we have at least 2 distinct months (July & August)
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(`July Software Subscription ${runId}`)
    await dialog.locator('#amount').fill('99')

    // Open DatePicker and select date in July
    await dialog.locator('#date').click()
    const calendarPopover = page.locator('[data-slot="popover-content"]')
    await expect(calendarPopover).toBeVisible({ timeout: 5000 })

    const prevMonthBtn = calendarPopover.getByRole('button', { name: /previous/i }).or(calendarPopover.locator('button[class*="button_previous"]')).first()
    await prevMonthBtn.click()

    await calendarPopover.getByRole('button', { name: /July 15/i }).or(calendarPopover.locator('button').filter({ hasText: /^15$/ })).first().click()
    await expect(dialog.locator('#date')).toContainText(/Jul/i)

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    // 2. Scroll up to charts and click "Compare Months" tab
    const compareMonthsTab = page.getByRole('tab', { name: /Compare Months/i })
    await expect(compareMonthsTab).toBeVisible({ timeout: 10_000 })
    await compareMonthsTab.click()

    // 3. Verify Month Selectors and Swap button
    const monthASelect = page.locator('button[aria-label="Select base month A"]')
    const monthBSelect = page.locator('button[aria-label="Select compare month B"]')
    await expect(monthASelect).toBeVisible({ timeout: 10_000 })
    await expect(monthBSelect).toBeVisible({ timeout: 10_000 })

    const swapBtn = page.locator('button[aria-label="Swap comparison months"]')
    await expect(swapBtn).toBeVisible()
    await swapBtn.click()

    // 4. Verify Delta KPI summary cards render (Income, Expense, Net Savings)
    await expect(page.getByText(/Total Income/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Total Expense/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Net Savings/i).first()).toBeVisible({ timeout: 10_000 })

    // 5. Toggle Chart Mode to "Top Expenses"
    const topExpensesTrigger = page.getByRole('tab', { name: /Top Expenses/i })
    if (await topExpensesTrigger.isVisible()) {
      await topExpensesTrigger.click()
      await expect(topExpensesTrigger).toHaveAttribute('data-state', 'active')
    }
  })
})
