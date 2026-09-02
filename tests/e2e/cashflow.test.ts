import { test, expect } from '@playwright/test'

const runId = Date.now()
const mainCashflowTitle = `E2E Cashflow Main ${runId}`
const bookAlphaTitle = `Book Alpha ${runId}`
const bookBetaTitle = `Book Beta ${runId}`
const incomeDescription = `Salary ${runId}`
const expenseDescription = `Lunch ${runId}`

let mainCashflowUrl: string

/**
 * ============================================================================
 * Cashflow Domain E2E Test Suite
 * ============================================================================
 * 1. Core Transaction Lifecycle (Create, Income, Expense, Edit, Delete, Filter)
 * 2. Split Transactions Engine (Breakdown line items & auto-sum total)
 * 3. Custom Tags & Labels Engine (Multi-tag filter, badges, and rename)
 * 4. Receipt Attachment Upload & Lightbox Viewer
 * 5. CSV Bank Import & Auto-Parser (Upload, mapping, preview, batch import)
 * 6. Monthly Comparison View (Compare Months tab, Month A vs B swap, Delta KPIs)
 * 7. Book Organization & Lifecycle (Pinning, Archiving, Restoring, Sorting Controls)
 * 8. Financial PDF Statement & Monthly Report Modal
 * 9. Teardown & Lifecycle Cleanup
 */
test.describe.serial('Cashflow Domain E2E Suite', () => {
  test.setTimeout(60_000)

  // --------------------------------------------------------------------------
  // 1. Core Transaction Lifecycle
  // --------------------------------------------------------------------------
  test('1.1 Create cashflow book and perform Income, Expense, Edit, Delete lifecycle', async ({ page }) => {
    // 1. Create main cashflow book
    await page.goto('/cashflow')
    await page.getByRole('button', { name: /New Cashflow/i }).first().click()

    await page.locator('#title').fill(mainCashflowTitle)
    await page.getByRole('dialog').getByRole('button', { name: /Create|Save/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    const cashflowLink = page.getByRole('link', { name: mainCashflowTitle }).first()
    await expect(cashflowLink).toBeVisible({ timeout: 10_000 })
    await cashflowLink.click()

    await page.waitForURL(/\/cashflow\/[a-f0-9-]{36}/, { timeout: 15_000 })
    await expect(page.getByText(mainCashflowTitle).first()).toBeVisible({ timeout: 10_000 })
    mainCashflowUrl = page.url()

    // 2. Add income entry (1000)
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(incomeDescription)
    await dialog.locator('#amount').fill('1000')

    const typeSelect = dialog.locator('button').filter({ hasText: /Income|Expense/i }).first()
    if (await typeSelect.isVisible()) {
      await typeSelect.click()
      await page.getByRole('option', { name: /Income/i }).first().click()
    }

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    await expect(page.getByText(incomeDescription).first()).toBeVisible({ timeout: 15_000 })
    const incomeStatCard = page.locator('div').filter({ hasText: /Income/i }).filter({ hasText: /\+?(Rp|\$)?\s*1[.,]000/i }).first()
    await expect(incomeStatCard).toBeVisible({ timeout: 15_000 })

    // 3. Add expense entry (300, Food)
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(expenseDescription)
    await dialog.locator('#amount').fill('300')

    const typeSelect2 = dialog.locator('button').filter({ hasText: /Income|Expense/i }).first()
    if (await typeSelect2.isVisible()) {
      await typeSelect2.click()
      await page.getByRole('option', { name: /Expense/i }).first().click()
    }

    const categorySelect = dialog.locator('button').filter({ hasText: /Category|Uncategorized/i }).first()
    if (await categorySelect.isVisible()) {
      await categorySelect.click()
      const foodOption = page.getByRole('option', { name: /Food/i }).first()
      if (await foodOption.isVisible()) {
        await foodOption.click()
      } else {
        await page.keyboard.press('Escape')
      }
    }

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    await expect(page.getByText(expenseDescription).first()).toBeVisible({ timeout: 15_000 })
    const balanceStatCard = page.locator('div').filter({ hasText: /Net Balance/i }).filter({ hasText: /\+?(Rp|\$)?\s*700/i }).first()
    await expect(balanceStatCard).toBeVisible({ timeout: 15_000 })

    // 4. Edit expense entry to 500
    const expenseRow = page.locator('tr, div.group').filter({ hasText: expenseDescription }).first()
    await expect(expenseRow).toBeVisible()
    await expenseRow.getByRole('button').first().click()

    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('#amount').fill('500')

    await dialog.getByRole('button', { name: /Save|Update/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    const updatedBalanceStatCard = page.locator('div').filter({ hasText: /Net Balance/i }).filter({ hasText: /\+?(Rp|\$)?\s*500/i }).first()
    await expect(updatedBalanceStatCard).toBeVisible({ timeout: 15_000 })

    // 5. Delete expense entry and verify balance returns to 1000
    const expenseRowToDelete = page.locator('tr, div.group').filter({ hasText: expenseDescription }).first()
    await expect(expenseRowToDelete).toBeVisible()
    await expenseRowToDelete.getByRole('button').nth(1).click()

    const confirmDialog = page.getByRole('alertdialog').filter({ hasText: /Delete Entry/i })
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole('button', { name: /Delete/i }).click()
    await expect(confirmDialog).not.toBeVisible({ timeout: 5000 })

    await expect(expenseRowToDelete).not.toBeVisible({ timeout: 15_000 })
    const restoredBalanceStatCard = page.locator('div').filter({ hasText: /Net Balance/i }).filter({ hasText: /\+?(Rp|\$)?\s*1[.,]000/i }).first()
    await expect(restoredBalanceStatCard).toBeVisible({ timeout: 15_000 })

    // 6. Apply Date Period Filter ("This Month")
    const filterTrigger = page.getByRole('combobox', { name: /Filter by date period/i }).first()
    await expect(filterTrigger).toBeVisible()
    await filterTrigger.click()
    await page.getByRole('option', { name: /This Month/i }).click()
    await expect(page.getByText(incomeDescription).first()).toBeVisible({ timeout: 15_000 })
  })

  // --------------------------------------------------------------------------
  // 2. Split Transactions Engine
  // --------------------------------------------------------------------------
  test('2.1 Split transactions engine — line-item breakdown and auto-sum total', async ({ page }) => {
    await page.goto(mainCashflowUrl)

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

    // Verify parent amount input reflects auto-calculated sum ($100.00) and is disabled
    const parentAmount = dialog.locator('#amount')
    await expect(parentAmount).toBeDisabled()
    await expect(parentAmount).toHaveValue('100.00')

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    const row = page.locator('tr, div.group').filter({ hasText: `Supermarket Split ${runId}` }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await expect(row.getByText(/2 items/i)).toBeVisible({ timeout: 10_000 })
    await expect(row.getByText(/100/)).toBeVisible({ timeout: 10_000 })

    // Verify breakdown preserved on reopen
    await row.getByRole('button').first().click()
    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible()
    await expect(editDialog.locator('input[placeholder*="Item 1 name"]')).toHaveValue('Groceries')
    await expect(editDialog.locator('input[placeholder*="Item 2 name"]')).toHaveValue('Cleaning Supplies')
    await editDialog.getByRole('button', { name: /Cancel|Close/i }).first().click()
  })

  // --------------------------------------------------------------------------
  // 3. Custom Tags & Labels Engine
  // --------------------------------------------------------------------------
  test('3.1 Custom tags assignment, toolbar filtering, and tag rename', async ({ page }) => {
    await page.goto(mainCashflowUrl)

    // Add Entry A with tags
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(`Consulting Invoice ${runId}`)
    await dialog.locator('#amount').fill('250')

    const tagInput = dialog.getByRole('combobox', { name: /Add tag/i })
    await tagInput.fill('TaxDeductible')
    await tagInput.press('Enter')
    await tagInput.fill('ProjectAlpha')
    await tagInput.press('Enter')

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    // Add Entry B with tag #Personal
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

    // Verify tag badges
    const rowA = page.locator('tr, div.group').filter({ hasText: `Consulting Invoice ${runId}` }).first()
    await expect(rowA.getByText('#TaxDeductible')).toBeVisible({ timeout: 10_000 })
    await expect(rowA.getByText('#ProjectAlpha')).toBeVisible({ timeout: 10_000 })

    const rowB = page.locator('tr, div.group').filter({ hasText: `Personal Coffee ${runId}` }).first()
    await expect(rowB.getByText('#Personal')).toBeVisible({ timeout: 10_000 })

    // Toolbar filter strip
    const tagFilterButton = page.getByRole('button', { name: '#TaxDeductible' }).first()
    await expect(tagFilterButton).toBeVisible({ timeout: 10_000 })
    await tagFilterButton.click()

    await expect(page.locator('tr, div.group').filter({ hasText: `Consulting Invoice ${runId}` })).toBeVisible()
    await expect(page.locator('tr, div.group').filter({ hasText: `Personal Coffee ${runId}` })).not.toBeVisible()

    const resetTagsButton = page.getByRole('button', { name: /Reset tags/i })
    if (await resetTagsButton.isVisible()) {
      await resetTagsButton.click()
    } else {
      await tagFilterButton.click()
    }
    await expect(page.locator('tr, div.group').filter({ hasText: `Personal Coffee ${runId}` })).toBeVisible({ timeout: 10_000 })

    // Rename tag #TaxDeductible -> #TaxAudit2026
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

    await expect(page.getByText('#TaxAudit2026').first()).toBeVisible({ timeout: 10_000 })
  })

  // --------------------------------------------------------------------------
  // 4. Receipt Attachment Upload & Lightbox Viewer
  // --------------------------------------------------------------------------
  test('4.1 Receipt attachment upload and ReceiptLightbox preview', async ({ page }) => {
    await page.goto(mainCashflowUrl)

    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(`Business Lunch with Receipt ${runId}`)
    await dialog.locator('#amount').fill('85.50')

    const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const fileInput = dialog.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'receipt-lunch.png',
      mimeType: 'image/png',
      buffer: Buffer.from(samplePngBase64, 'base64'),
    })

    await expect(dialog.getByText(/receipt-lunch\.png/i)).toBeVisible({ timeout: 5000 })

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 15_000 })

    const row = page.locator('tr, div.group').filter({ hasText: `Business Lunch with Receipt ${runId}` }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })

    const receiptBadge = row.getByRole('button', { name: /View receipt attachment|Receipt/i }).first()
    await expect(receiptBadge).toBeVisible({ timeout: 10_000 })

    await receiptBadge.click()
    const lightbox = page.getByRole('dialog').filter({ hasText: /Receipt/i })
    await expect(lightbox).toBeVisible({ timeout: 10_000 })

    const zoomInBtn = lightbox.getByRole('button', { name: /Zoom In/i }).or(lightbox.locator('button[title*="Zoom In"]'))
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click()
    }

    const closeLightboxBtn = lightbox.getByRole('button', { name: /Close/i }).first()
    if (await closeLightboxBtn.isVisible()) {
      await closeLightboxBtn.click()
    } else {
      await page.keyboard.press('Escape')
    }
    await expect(lightbox).not.toBeVisible({ timeout: 5000 })
  })

  // --------------------------------------------------------------------------
  // 5. CSV Bank Statement Import
  // --------------------------------------------------------------------------
  test('5.1 CSV bank statement upload, column mapping, preview, and batch import', async ({ page }) => {
    await page.goto(mainCashflowUrl)

    // Open options dropdown menu ('More options')
    const detailActionsBtn = page.getByRole('button', { name: 'More options' }).first()
    await expect(detailActionsBtn).toBeVisible({ timeout: 5000 })
    await detailActionsBtn.click()

    const importMenuItem = page.getByRole('menuitem', { name: /Import CSV/i })
    await expect(importMenuItem).toBeVisible({ timeout: 5000 })
    await importMenuItem.click()

    const importModal = page.getByRole('dialog', { name: /Import.*Transactions/i })
    await expect(importModal).toBeVisible({ timeout: 5000 })

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

    await expect(importModal.getByText(/Date Column/i)).toBeVisible({ timeout: 10_000 })
    await expect(importModal.getByText(/3 rows found/i)).toBeVisible({ timeout: 10_000 })

    const previewBtn = importModal.getByRole('button', { name: /Preview Transactions/i })
    await expect(previewBtn).toBeVisible()
    await previewBtn.click()

    await expect(importModal.getByText('Client Project Fee')).toBeVisible({ timeout: 10_000 })
    await expect(importModal.getByText('Cloud Server Hosting')).toBeVisible({ timeout: 10_000 })

    const confirmImportBtn = importModal.getByRole('button', { name: /Import 3 Transactions/i })
    await expect(confirmImportBtn).toBeVisible()
    await confirmImportBtn.click()

    await expect(importModal).not.toBeVisible({ timeout: 15_000 })

    await expect(page.getByText('Client Project Fee').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Cloud Server Hosting').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Office Stationery').first()).toBeVisible({ timeout: 15_000 })
  })

  // --------------------------------------------------------------------------
  // 6. Monthly Comparison View
  // --------------------------------------------------------------------------
  test('6.1 Monthly comparison view — swap months, delta KPI cards, and expense distribution', async ({ page }) => {
    await page.goto(mainCashflowUrl)

    // Add entry in July for multi-month delta
    await page.getByRole('button', { name: /Add Entry/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#description').fill(`July Software Subscription ${runId}`)
    await dialog.locator('#amount').fill('99')

    await dialog.locator('#date').click()
    const calendarPopover = page.locator('[data-slot="popover-content"]')
    await expect(calendarPopover).toBeVisible({ timeout: 5000 })

    const prevMonthBtn = calendarPopover.getByRole('button', { name: /previous/i }).or(calendarPopover.locator('button[class*="button_previous"]')).first()
    await prevMonthBtn.click()
    await calendarPopover.locator('button').filter({ hasText: /^15$/ }).first().click()
    await expect(dialog.locator('#date')).toContainText(/15/i)

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    // Open Compare Months tab
    const compareMonthsTab = page.getByRole('tab', { name: /Compare Months/i })
    await expect(compareMonthsTab).toBeVisible({ timeout: 10_000 })
    await compareMonthsTab.click()

    const monthASelect = page.locator('button[aria-label="Select base month A"]')
    const monthBSelect = page.locator('button[aria-label="Select compare month B"]')
    await expect(monthASelect).toBeVisible({ timeout: 10_000 })
    await expect(monthBSelect).toBeVisible({ timeout: 10_000 })

    const swapBtn = page.locator('button[aria-label="Swap comparison months"]')
    await expect(swapBtn).toBeVisible()
    await swapBtn.click()

    await expect(page.getByText(/Total Income/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Total Expense/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Net Savings/i).first()).toBeVisible({ timeout: 10_000 })
  })

  // --------------------------------------------------------------------------
  // 7. Book Organization Lifecycle & Financial PDF Statement Modal
  // --------------------------------------------------------------------------
  test('7.1 Book organization — pinning, archiving/restoring, sort controls, and PDF statement report', async ({ page }) => {
    await page.goto('/cashflow')

    // Create Book Alpha
    await page.getByRole('button', { name: /New Cashflow/i }).first().click()
    let createDialog = page.getByRole('dialog')
    await expect(createDialog).toBeVisible({ timeout: 5000 })
    await createDialog.locator('#title').fill(bookAlphaTitle)
    await createDialog.getByRole('button', { name: /Create|Save/i }).click()
    await expect(createDialog).not.toBeVisible({ timeout: 5000 })

    // Create Book Beta
    await page.getByRole('button', { name: /New Cashflow/i }).first().click()
    createDialog = page.getByRole('dialog')
    await expect(createDialog).toBeVisible({ timeout: 5000 })
    await createDialog.locator('#title').fill(bookBetaTitle)
    await createDialog.getByRole('button', { name: /Create|Save/i }).click()
    await expect(createDialog).not.toBeVisible({ timeout: 5000 })

    // Pin Book Alpha
    const bookAlphaActionsBtn = page.getByRole('button', { name: `Actions for ${bookAlphaTitle}` })
    await expect(bookAlphaActionsBtn).toBeVisible({ timeout: 5000 })
    await bookAlphaActionsBtn.click()

    const pinMenuItem = page.getByRole('menuitem', { name: /Pin to top/i })
    await expect(pinMenuItem).toBeVisible({ timeout: 5000 })
    await pinMenuItem.click()
    await expect(page.getByText(/Pinned \(\d+\)/i).first()).toBeVisible({ timeout: 10_000 })

    // Unpin Book Alpha
    await page.getByRole('button', { name: `Actions for ${bookAlphaTitle}` }).click()
    const unpinMenuItem = page.getByRole('menuitem', { name: /Unpin from top/i })
    await expect(unpinMenuItem).toBeVisible({ timeout: 5000 })
    await unpinMenuItem.click()
    await expect(page.getByText(/Cashflow unpinned/i).first()).toBeVisible({ timeout: 10_000 })

    // Archive Book Beta
    const bookBetaActionsBtn = page.getByRole('button', { name: `Actions for ${bookBetaTitle}` })
    await expect(bookBetaActionsBtn).toBeVisible({ timeout: 10_000 })
    await bookBetaActionsBtn.click()

    const archiveMenuItem = page.getByRole('menuitem', { name: /Archive/i })
    await expect(archiveMenuItem).toBeVisible({ timeout: 5000 })
    await archiveMenuItem.click()

    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog).toBeVisible({ timeout: 5000 })
    await alertDialog.getByRole('button', { name: 'Archive', exact: true }).click()
    await expect(alertDialog).not.toBeVisible({ timeout: 10_000 })

    // Switch to Archived Tab and Restore
    const archivedTabButton = page.getByRole('tab', { name: /Archived/i })
    await archivedTabButton.click()
    await expect(page.getByText(bookBetaTitle).first()).toBeVisible({ timeout: 10_000 })

    const restoreBtn = page.locator('div.group').filter({ hasText: bookBetaTitle }).getByRole('button', { name: /Restore/i }).first()
    await restoreBtn.click()
    await expect(page.getByText(/restored to active dashboard/i).first()).toBeVisible({ timeout: 10_000 })

    const activeTabButton = page.getByRole('tab', { name: /Active/i })
    await activeTabButton.click()
    await expect(page.getByText(bookBetaTitle).first()).toBeVisible({ timeout: 10_000 })

    // Sort selector test
    const sortButton = page.locator('button').filter({ hasText: /Sort by:/i }).first()
    await expect(sortButton).toBeVisible({ timeout: 10_000 })
    await sortButton.click()

    const alphaOption = page.getByRole('menuitem', { name: /Alphabetical \(A - Z\)/i })
    await expect(alphaOption).toBeVisible({ timeout: 5000 })
    await alphaOption.click()
    await expect(page.locator('button').filter({ hasText: /Alphabetical \(A - Z\)/i }).first()).toBeVisible({ timeout: 5000 })

    // Test Financial PDF Statement & Monthly Report Modal on Book Alpha
    const bookLink = page.getByRole('link', { name: bookAlphaTitle }).first()
    await bookLink.click()
    await page.waitForURL(/\/cashflow\/[a-f0-9-]{36}/, { timeout: 15_000 })

    const detailActionsBtn = page.getByRole('button', { name: 'More options' }).first()
    await expect(detailActionsBtn).toBeVisible({ timeout: 5000 })
    await detailActionsBtn.click()

    const reportMenuItem = page.getByRole('menuitem', { name: /Financial Report/i })
    await expect(reportMenuItem).toBeVisible({ timeout: 5000 })
    await reportMenuItem.click()

    const reportDialog = page.getByRole('dialog')
    await expect(reportDialog).toBeVisible({ timeout: 5000 })
    await expect(reportDialog.getByText(/Financial Statement & Summary|Financial Report/i).first()).toBeVisible({ timeout: 5000 })

    await page.keyboard.press('Escape')
    await expect(reportDialog).not.toBeVisible({ timeout: 5000 })
  })

  // --------------------------------------------------------------------------
  // 8. Teardown & Lifecycle Cleanup
  // --------------------------------------------------------------------------
  test('8.1 Lifecycle cleanup — delete all created test cashflow books', async ({ page }) => {
    await page.goto('/cashflow')

    for (const title of [mainCashflowTitle, bookAlphaTitle, bookBetaTitle]) {
      const row = page.locator('div.group').filter({ hasText: title }).first()
      if (await row.isVisible()) {
        const actionBtn = page.getByRole('button', { name: `Actions for ${title}` }).first()
        if (await actionBtn.isVisible()) {
          await actionBtn.click()
          const deleteMenuItem = page.getByRole('menuitem', { name: 'Delete' })
          if (await deleteMenuItem.isVisible()) {
            await deleteMenuItem.click()
            const deleteDialog = page.getByRole('alertdialog')
            await expect(deleteDialog).toBeVisible({ timeout: 5000 })
            await deleteDialog.getByRole('button', { name: 'Delete' }).click()
            await expect(deleteDialog).not.toBeVisible({ timeout: 10_000 })
          }
        }
      }
    }
  })
})
