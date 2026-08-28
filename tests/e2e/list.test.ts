import { test, expect } from '@playwright/test';

const runId = Date.now();
const testTodoTitle = `E2E Board ${runId}`;
const testWishlistTitle = `E2E Wishlist ${runId}`;
const testIdeaTitle = `E2E Idea List ${runId}`;

/**
 * End-to-End Test Suite for List App:
 * - Todo Board Lifecycle (Board, Columns, Cards, Deletion)
 * - Wishlist Lifecycle (Wishlist, Item with price/currency, Purchased toggle, Deletion)
 * - Ideas Lifecycle (Idea List, Inline Idea creation, Deletion)
 */
test.describe.serial('List App E2E Flow', () => {

  test('1. Todo Board Lifecycle', async ({ page }) => {
    await page.goto('/list/todo');

    // Open create board modal
    await page.getByRole('button', { name: /New Board/i }).first().click();
    await page.locator('#create-list-title').fill(testTodoTitle);
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify board card is visible in grid
    const boardCard = page.locator('div.group').filter({ hasText: testTodoTitle }).first();
    await expect(boardCard).toBeVisible({ timeout: 10000 });

    // Open Kanban board
    await boardCard.getByRole('link', { name: `Open ${testTodoTitle}` }).click();
    await page.waitForURL(/\/list\/todo\/.+/, { timeout: 10000 });

    // Verify 4 default columns are visible
    await expect(page.getByText('Todo', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('In Progress', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Review', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible();

    // Add card to Todo column
    const addCardBtn = page.getByRole('button', { name: 'Add Card' }).first();
    await addCardBtn.click();

    const cardTitle = `E2E Task ${runId}`;
    const cardInput = page.getByPlaceholder('Card title...').first();
    await cardInput.fill(cardTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).first().click();
    await expect(page.getByText(cardTitle).first()).toBeVisible({ timeout: 10000 });

    // Mark card as complete and verify strikethrough state
    const card = page.locator('div.group').filter({ hasText: cardTitle }).first();
    const checkbox = card.getByRole('checkbox', { name: `Mark "${cardTitle}" as complete` });
    await checkbox.click();
    await expect(card.locator('p').first()).toHaveClass(/line-through/);

    // Test Edit Modal (fill description, save, reopen to verify, and close)
    await card.getByRole('button', { name: `Edit task "${cardTitle}"`, exact: true }).click();
    const cardDesc = `Description for task ${runId}`;
    await page.getByPlaceholder(/add details to this task/i).fill(cardDesc);
    await page.getByRole('dialog').getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Reopen modal to verify saved description persistence
    await card.getByRole('button', { name: `Edit task "${cardTitle}"`, exact: true }).click();
    await expect(page.getByPlaceholder(/add details to this task/i)).toHaveValue(cardDesc);
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Test drag-and-drop move to Completed column
    const todoColumn = page.locator('div.w-70, div.w-\\[280px\\]').filter({ hasText: 'Todo' }).first();
    const completedColumn = page.locator('div.w-70, div.w-\\[280px\\]').filter({ hasText: 'Completed' }).first();

    // Verify card is currently in Todo column and NOT in Completed column
    await expect(todoColumn.getByText(cardTitle).first()).toBeVisible();
    await expect(completedColumn.getByText(cardTitle)).not.toBeVisible();

    const cardBox = await card.boundingBox();
    const colBox = await completedColumn.boundingBox();

    if (cardBox && colBox) {
      await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
      await page.mouse.down();
      // 1. Move 10px to trigger @dnd-kit activation constraint (distance: 5)
      await page.mouse.move(cardBox.x + cardBox.width / 2 + 10, cardBox.y + cardBox.height / 2 + 10, { steps: 5 });
      // 2. Drag over target column
      await page.mouse.move(colBox.x + colBox.width / 2, colBox.y + colBox.height / 2 + 50, { steps: 10 });
      await page.mouse.up();
    }

    // Wait for @dnd-kit 250ms drop animation to settle
    await page.waitForTimeout(300);

    // Verify the card is settled inside the Completed column
    await expect(completedColumn.getByText(cardTitle).first()).toBeVisible({ timeout: 10000 });

    // Cleanup: Return to /list/todo and delete board
    await page.goto('/list/todo');
    const boardToCleanup = page.locator('div.group').filter({ hasText: testTodoTitle }).first();
    await boardToCleanup.hover();
    await boardToCleanup.getByRole('button', { name: 'List actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(boardToCleanup).not.toBeVisible({ timeout: 10000 });
  });

  test('2. Wishlist Lifecycle', async ({ page }) => {
    await page.goto('/list/wishlist');

    // Open create wishlist modal
    await page.getByRole('button', { name: /New Wishlist/i }).first().click();
    await page.locator('#create-list-title').fill(testWishlistTitle);
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify wishlist card is visible
    const wishlistCard = page.locator('div.group').filter({ hasText: testWishlistTitle }).first();
    await expect(wishlistCard).toBeVisible({ timeout: 10000 });

    // Open Wishlist detail
    await wishlistCard.getByRole('link', { name: `Open ${testWishlistTitle}` }).click();
    await page.waitForURL(/\/list\/wishlist\/.+/, { timeout: 10000 });

    // Add wish item with title, price, and currency
    await page.getByRole('button', { name: 'Add Wish' }).first().click();
    const wishTitle = `E2E Wish ${runId}`;
    await page.locator('#wish-title').fill(wishTitle);
    await page.locator('#wish-price').fill('150.00');
    await page.locator('#wish-currency').fill('USD');
    await page.getByRole('button', { name: 'Add Wish', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify item appears with price badge
    await expect(page.getByText(wishTitle).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/USD 150/).first()).toBeVisible();

    // Mark as purchased and verify strikethrough state
    const wishRow = page.locator('div.group').filter({ hasText: wishTitle }).first();
    const wishCheckbox = wishRow.getByRole('checkbox', { name: `Mark "${wishTitle}" as purchased` });
    await wishCheckbox.click();
    await expect(wishRow.getByText(wishTitle)).toHaveClass(/line-through/);

    // Cleanup: Return to /list/wishlist and delete wishlist
    await page.goto('/list/wishlist');
    const wishlistToCleanup = page.locator('div.group').filter({ hasText: testWishlistTitle }).first();
    await wishlistToCleanup.hover();
    await wishlistToCleanup.getByRole('button', { name: 'List actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(wishlistToCleanup).not.toBeVisible({ timeout: 10000 });
  });

  test('3. Ideas Lifecycle', async ({ page }) => {
    await page.goto('/list/ideas');

    // 1. Create quick idea directly on /list/ideas page
    const quickIdeaText = `Quick Idea ${runId}`;
    const mainInput = page.getByPlaceholder(/capture an idea/i).first();
    await mainInput.fill(quickIdeaText);
    await page.getByRole('button', { name: /add idea/i }).first().click();
    await expect(page.getByText(quickIdeaText).first()).toBeVisible({ timeout: 10000 });

    // 2. Create Idea List Book
    await page.getByRole('button', { name: /New Idea List/i }).first().click();
    await page.locator('#create-list-title').fill(testIdeaTitle);
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    const ideaCard = page.locator('div.group').filter({ hasText: testIdeaTitle }).first();
    await expect(ideaCard).toBeVisible({ timeout: 10000 });

    // 3. Move quick idea into the created Idea List Book
    const moveBtn = page.getByRole('button', { name: `Move "${quickIdeaText}" to a list` });
    await moveBtn.click();
    await page.getByRole('menuitem', { name: testIdeaTitle }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Move' }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 5000 });

    // 4. Open Idea List Book detail page and verify moved idea is present
    const bookLink = page.locator('div.group').filter({ hasText: testIdeaTitle }).first().getByRole('link', { name: `Open ${testIdeaTitle}` });
    await bookLink.click();
    await page.waitForURL(/\/list\/ideas\/.+/, { timeout: 10000 });
    await expect(page.getByText(quickIdeaText).first()).toBeVisible({ timeout: 10000 });

    // 5. Add another idea directly inside the book
    const bookIdeaText = `Book Idea ${runId}`;
    const bookInput = page.getByPlaceholder(/add an idea/i).first();
    await bookInput.fill(bookIdeaText);
    await page.getByRole('button', { name: /add idea/i }).first().click();
    await expect(page.getByText(bookIdeaText).first()).toBeVisible({ timeout: 10000 });

    // 6. Delete the book idea item (testing item deletion)
    const bookIdeaRow = page.locator('div.group').filter({ hasText: bookIdeaText }).first();
    await bookIdeaRow.getByRole('button', { name: `Delete "${bookIdeaText}"` }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(bookIdeaRow).not.toBeVisible({ timeout: 10000 });

    // Cleanup: Return to /list/ideas and delete list
    await page.goto('/list/ideas');
    const ideaToCleanup = page.locator('div.group').filter({ hasText: testIdeaTitle }).first();
    await ideaToCleanup.hover();
    await ideaToCleanup.getByRole('button', { name: 'List actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(ideaToCleanup).not.toBeVisible({ timeout: 10000 });
  });

});
