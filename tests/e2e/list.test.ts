import { test, expect } from '@playwright/test'

const runId = Date.now()
const testTodoTitle = `E2E Board ${runId}`
const testWishlistTitle = `E2E Wishlist ${runId}`
const testIdeaTitle = `E2E Idea List ${runId}`

/**
 * ============================================================================
 * List Domain E2E Test Suite
 * ============================================================================
 * 1. Todo Board Lifecycle (Board, Columns, Cards, Drag/Drop, Deletion)
 * 2. Wishlist Lifecycle (Wishlist, Items with price/currency, Purchased toggle)
 * 3. Ideas Lifecycle (Quick capture, Move to book, Book item CRUD, Deletion)
 * 4. Pre-built Board Templates (TemplatePickerModal, auto-populated columns & cards)
 * 5. Card Due Dates & Quick Selectors (Today, Tomorrow, urgency badge styling)
 * 6. Card Priority Levels & Toolbar Filtering / Sorting Engine
 * 7. Card Subtasks & Checklist Engine with Progress Calculation
 * 8. Recurring Tasks Engine & Cycle Advancement
 * 9. Teardown & Lifecycle Cleanup
 */
test.describe.serial('List Domain E2E Suite', () => {
  test.setTimeout(60_000)

  let templateBoardUrl: string

  // --------------------------------------------------------------------------
  // 1. Todo Board Lifecycle
  // --------------------------------------------------------------------------
  test('1.1 Todo board lifecycle (create, add card, complete, edit details, drag/drop, delete)', async ({ page }) => {
    await page.goto('/list/todo')

    await page.getByRole('button', { name: /New Board/i }).first().click()
    await page.locator('#create-list-title').fill(testTodoTitle)
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    const boardCard = page.locator('div.group').filter({ hasText: testTodoTitle }).first()
    await expect(boardCard).toBeVisible({ timeout: 10000 })

    await boardCard.getByRole('link', { name: `Open ${testTodoTitle}` }).click()
    await page.waitForURL(/\/list\/todo\/.+/, { timeout: 10000 })

    await expect(page.getByRole('button', { name: /Edit column Todo/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /Edit column In Progress/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /Edit column Review/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /Edit column Completed/i })).toBeVisible({ timeout: 10_000 })

    const addCardBtn = page.getByRole('button', { name: 'Add Card' }).first()
    await addCardBtn.click()

    const cardTitle = `E2E Task ${runId}`
    const cardInput = page.getByPlaceholder('Card title...').first()
    await cardInput.fill(cardTitle)
    await page.getByRole('button', { name: 'Add', exact: true }).first().click()
    await expect(page.getByText(cardTitle).first()).toBeVisible({ timeout: 10000 })

    const card = page.locator('div.group').filter({ hasText: cardTitle }).first()
    const checkbox = card.getByRole('checkbox', { name: `Mark "${cardTitle}" as complete` })
    await checkbox.click()
    await expect(card.locator('p').first()).toHaveClass(/line-through/)

    await card.getByRole('button', { name: `Edit task "${cardTitle}"`, exact: true }).click()
    const cardDesc = `Description for task ${runId}`
    await page.getByPlaceholder(/add details to this task/i).fill(cardDesc)
    await page.getByRole('dialog').getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Drag-and-drop to Completed column
    const todoColumn = page.locator('div.w-70, div.w-\\[280px\\]').filter({ hasText: 'Todo' }).first()
    const completedColumn = page.locator('div.w-70, div.w-\\[280px\\]').filter({ hasText: 'Completed' }).first()

    await expect(todoColumn.getByText(cardTitle).first()).toBeVisible()
    await expect(completedColumn.getByText(cardTitle)).not.toBeVisible()

    const cardBox = await card.boundingBox()
    const colBox = await completedColumn.boundingBox()

    if (cardBox && colBox) {
      await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2)
      await page.mouse.down()
      await page.mouse.move(cardBox.x + cardBox.width / 2 + 10, cardBox.y + cardBox.height / 2 + 10, { steps: 5 })
      await page.mouse.move(colBox.x + colBox.width / 2, colBox.y + colBox.height / 2 + 50, { steps: 10 })
      await page.mouse.up()
    }

    await page.waitForTimeout(300)
    await expect(completedColumn.getByText(cardTitle).first()).toBeVisible({ timeout: 10000 })

    // Cleanup
    await page.goto('/list/todo')
    const boardToCleanup = page.locator('div.group').filter({ hasText: testTodoTitle }).first()
    await boardToCleanup.hover()
    await boardToCleanup.getByRole('button', { name: 'List actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(boardToCleanup).not.toBeVisible({ timeout: 10000 })
  })

  // --------------------------------------------------------------------------
  // 2. Wishlist Lifecycle
  // --------------------------------------------------------------------------
  test('2.1 Wishlist lifecycle (create, add item with price, mark purchased, delete)', async ({ page }) => {
    await page.goto('/list/wishlist')

    await page.getByRole('button', { name: /New Wishlist/i }).first().click()
    await page.locator('#create-list-title').fill(testWishlistTitle)
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    const wishlistCard = page.locator('div.group').filter({ hasText: testWishlistTitle }).first()
    await expect(wishlistCard).toBeVisible({ timeout: 10000 })

    await wishlistCard.getByRole('link', { name: `Open ${testWishlistTitle}` }).click()
    await page.waitForURL(/\/list\/wishlist\/.+/, { timeout: 10000 })

    await page.getByRole('button', { name: 'Add Wish' }).first().click()
    const wishTitle = `E2E Wish ${runId}`
    await page.locator('#wish-title').fill(wishTitle)
    await page.locator('#wish-price').fill('150.00')
    await page.locator('#wish-currency').fill('USD')
    await page.getByRole('button', { name: 'Add Wish', exact: true }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    await expect(page.getByText(wishTitle).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/USD 150/).first()).toBeVisible()

    const wishRow = page.locator('div.group').filter({ hasText: wishTitle }).first()
    const wishCheckbox = wishRow.getByRole('checkbox', { name: `Mark "${wishTitle}" as purchased` })
    await wishCheckbox.click()
    await expect(wishRow.getByText(wishTitle)).toHaveClass(/line-through/)

    await page.goto('/list/wishlist')
    const wishlistToCleanup = page.locator('div.group').filter({ hasText: testWishlistTitle }).first()
    await wishlistToCleanup.hover()
    await wishlistToCleanup.getByRole('button', { name: 'List actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(wishlistToCleanup).not.toBeVisible({ timeout: 10000 })
  })

  // --------------------------------------------------------------------------
  // 3. Ideas Lifecycle
  // --------------------------------------------------------------------------
  test('3.1 Ideas lifecycle (quick idea capture, create book, move idea, delete item and book)', async ({ page }) => {
    await page.goto('/list/ideas')

    const quickIdeaText = `Quick Idea ${runId}`
    const mainInput = page.getByPlaceholder(/capture an idea/i).first()
    await mainInput.fill(quickIdeaText)
    await page.getByRole('button', { name: /add idea/i }).first().click()
    await expect(page.getByText(quickIdeaText).first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /New Idea List/i }).first().click()
    await page.locator('#create-list-title').fill(testIdeaTitle)
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    const ideaCard = page.locator('div.group').filter({ hasText: testIdeaTitle }).first()
    await expect(ideaCard).toBeVisible({ timeout: 10000 })

    const moveBtn = page.getByRole('button', { name: `Move "${quickIdeaText}" to a list` })
    await moveBtn.click()
    await page.getByRole('menuitem', { name: testIdeaTitle }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Move' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 5000 })

    const bookLink = page.locator('div.group').filter({ hasText: testIdeaTitle }).first().getByRole('link', { name: `Open ${testIdeaTitle}` })
    await bookLink.click()
    await page.waitForURL(/\/list\/ideas\/.+/, { timeout: 10000 })
    await expect(page.getByText(quickIdeaText).first()).toBeVisible({ timeout: 10000 })

    const bookIdeaText = `Book Idea ${runId}`
    const bookInput = page.getByPlaceholder(/add an idea/i).first()
    await bookInput.fill(bookIdeaText)
    await page.getByRole('button', { name: /add idea/i }).first().click()
    await expect(page.getByText(bookIdeaText).first()).toBeVisible({ timeout: 10000 })

    const bookIdeaRow = page.locator('div.group').filter({ hasText: bookIdeaText }).first()
    await bookIdeaRow.getByRole('button', { name: `Delete "${bookIdeaText}"` }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(bookIdeaRow).not.toBeVisible({ timeout: 10000 })

    await page.goto('/list/ideas')
    const ideaToCleanup = page.locator('div.group').filter({ hasText: testIdeaTitle }).first()
    await ideaToCleanup.hover()
    await ideaToCleanup.getByRole('button', { name: 'List actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(ideaToCleanup).not.toBeVisible({ timeout: 10000 })
  })

  // --------------------------------------------------------------------------
  // 4. Pre-built Templates, Due Dates, Priority, Subtasks & Recurrence
  // --------------------------------------------------------------------------
  test('4.1 Pre-built board templates — choose template, auto-populate columns & starter cards', async ({ page }) => {
    await page.goto('/list/todo')

    const templatePickerBtn = page.locator('#open-template-picker, button:has-text("Templates")').first()
    await expect(templatePickerBtn).toBeVisible({ timeout: 10_000 })
    await templatePickerBtn.click()

    const templateDialog = page.getByRole('dialog').filter({ hasText: /Choose a Template/i })
    await expect(templateDialog).toBeVisible({ timeout: 5000 })

    await expect(templateDialog.getByText('Sprint Board')).toBeVisible()
    await expect(templateDialog.getByText('Content Calendar')).toBeVisible()

    const sprintTemplateCard = templateDialog.locator('div[role="button"]').filter({ hasText: 'Sprint Board' }).first()
    await sprintTemplateCard.click()

    await page.waitForURL(/\/list\/todo\/[a-f0-9-]+/, { timeout: 15_000 })
    templateBoardUrl = page.url()

    await expect(page.getByRole('button', { name: /Edit column Backlog/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /Edit column Todo/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /Edit column In Progress/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Define sprint goal').first()).toBeVisible({ timeout: 10_000 })
  })

  test('4.2 Card due dates, priority levels, subtasks checklist, and recurring engine', async ({ page }) => {
    await page.goto(templateBoardUrl)

    // 1. Due date & priority on "Define sprint goal"
    const card = page.locator('div.group').filter({ hasText: 'Define sprint goal' }).first()
    await expect(card).toBeVisible({ timeout: 10_000 })
    await card.getByRole('button', { name: /Edit task/i }).click()

    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible({ timeout: 5000 })

    const tomorrowBtn = editDialog.getByRole('button', { name: /tomorrow/i })
    await expect(tomorrowBtn).toBeVisible({ timeout: 5000 })
    await tomorrowBtn.click()

    const urgentBtn = editDialog.getByRole('button', { name: /urgent/i })
    await urgentBtn.click()

    // 2. Subtask checklist (Template pre-seeded with "Write acceptance criteria")
    const firstSubtaskCb = editDialog.getByRole('checkbox', { name: /Write acceptance criteria/i })
    await expect(firstSubtaskCb).toBeVisible({ timeout: 5000 })
    await firstSubtaskCb.click()

    // 3. Set Recurrence
    const dailyRecurrenceBtn = editDialog.getByRole('button', { name: /daily/i })
    await dailyRecurrenceBtn.click()

    await editDialog.getByRole('button', { name: /Save Changes/i }).click()
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 })

    // Verify badges on Kanban card
    await expect(card.getByText('Tomorrow').first()).toBeVisible({ timeout: 10_000 })
    await expect(card.getByText('Urgent').first()).toBeVisible({ timeout: 10_000 })
    await expect(card.getByText('1/2').first()).toBeVisible({ timeout: 10_000 })
    await expect(card.getByText('Daily').first()).toBeVisible({ timeout: 10_000 })

    // 4. Complete recurring task
    const completeCheckbox = card.getByRole('checkbox', { name: /Mark "Define sprint goal" as complete/i })
    await completeCheckbox.click()
    await expect(page.getByText(/Recurring task completed! Next cycle due on/i).first()).toBeVisible({ timeout: 10_000 })
  })

  // --------------------------------------------------------------------------
  // 5. Cleanup
  // --------------------------------------------------------------------------
  test('5.1 Lifecycle cleanup — delete template board', async ({ page }) => {
    await page.goto('/list/todo')

    const boardCard = page.locator('div.group').filter({ hasText: 'Sprint Board' }).first()
    if (await boardCard.isVisible()) {
      await boardCard.hover()
      await boardCard.getByRole('button', { name: 'List actions' }).click()
      await page.getByRole('menuitem', { name: 'Delete' }).click()

      const deleteDialog = page.getByRole('alertdialog')
      await expect(deleteDialog).toBeVisible()
      await deleteDialog.getByRole('button', { name: 'Delete' }).click()
      await expect(deleteDialog).not.toBeVisible({ timeout: 10_000 })
    }
  })
})
