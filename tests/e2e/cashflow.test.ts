import { test, expect } from '@playwright/test';

const runId = Date.now();
const cashflowTitle = `E2E Cashflow ${runId}`;
const incomeDescription = `Salary ${runId}`;
const expenseDescription = `Lunch ${runId}`;

/**
 * End-to-End Test Suite for Cashflow App:
 * Complete lifecycle test in a single serial flow (Creation, Income, Expense, Edit, Delete, Period Filter).
 */
test.describe.serial('Cashflow App E2E Flow', () => {
  test('Cashflow Lifecycle (Create, Income, Expense, Edit, Delete, Filter)', async ({ page }) => {
    // 1. Create cashflow book and open detail view
    await page.goto('/cashflow');
    await page.getByRole('button', { name: /New Cashflow/i }).first().click();

    await page.locator('#title').fill(cashflowTitle);
    await page.getByRole('dialog').getByRole('button', { name: /Create|Save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    const cashflowLink = page.getByRole('link', { name: cashflowTitle }).first();
    await expect(cashflowLink).toBeVisible({ timeout: 10_000 });
    await cashflowLink.click();

    await page.waitForURL(/\/cashflow\/[a-f0-9-]{36}/, { timeout: 15_000 });
    await expect(page.getByText(cashflowTitle).first()).toBeVisible({ timeout: 10_000 });

    // 2. Add income entry ($1000) and verify summary
    await page.getByRole('button', { name: /Add Entry/i }).first().click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('#description').fill(incomeDescription);
    await dialog.locator('#amount').fill('1000');

    const typeSelect = dialog.locator('button').filter({ hasText: /Income|Expense/i }).first();
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.getByRole('option', { name: /Income/i }).first().click();
    }

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    await expect(page.getByText(incomeDescription).first()).toBeVisible({ timeout: 15_000 });
    const incomeStatCard = page.locator('div').filter({ hasText: /Income/i }).filter({ hasText: /\+?\$\s*1,?000/i }).first();
    await expect(incomeStatCard).toBeVisible({ timeout: 15_000 });

    // 3. Add expense entry ($300, Food) and verify balance updates to $700
    await page.getByRole('button', { name: /Add Entry/i }).first().click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('#description').fill(expenseDescription);
    await dialog.locator('#amount').fill('300');

    const typeSelect2 = dialog.locator('button').filter({ hasText: /Income|Expense/i }).first();
    if (await typeSelect2.isVisible()) {
      await typeSelect2.click();
      await page.getByRole('option', { name: /Expense/i }).first().click();
    }

    const categorySelect = dialog.locator('button').filter({ hasText: /Category|Uncategorized/i }).first();
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      const foodOption = page.getByRole('option', { name: /Food/i }).first();
      if (await foodOption.isVisible()) {
        await foodOption.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    await dialog.getByRole('button', { name: /Save|Add Entry|Create/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    await expect(page.getByText(expenseDescription).first()).toBeVisible({ timeout: 15_000 });
    const balanceStatCard = page.locator('div').filter({ hasText: /Net Balance/i }).filter({ hasText: /\+?\$\s*700/i }).first();
    await expect(balanceStatCard).toBeVisible({ timeout: 15_000 });

    // 4. Edit expense entry to $500 and verify balance updates to $500
    const expenseRow = page.locator('tr, div.group').filter({ hasText: expenseDescription }).first();
    await expect(expenseRow).toBeVisible();
    await expenseRow.getByRole('button').first().click();

    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('#amount').fill('500');

    await dialog.getByRole('button', { name: /Save|Update/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    const updatedBalanceStatCard = page.locator('div').filter({ hasText: /Net Balance/i }).filter({ hasText: /\+?\$\s*500/i }).first();
    await expect(updatedBalanceStatCard).toBeVisible({ timeout: 15_000 });

    // 5. Delete expense entry and verify balance returns to $1000
    const expenseRowToDelete = page.locator('tr, div.group').filter({ hasText: expenseDescription }).first();
    await expect(expenseRowToDelete).toBeVisible();
    await expenseRowToDelete.getByRole('button').nth(1).click();

    const confirmDialog = page.getByRole('alertdialog').filter({ hasText: /Delete Entry/i });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /Delete/i }).click();
    await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });

    await expect(page.getByText(expenseDescription)).not.toBeVisible({ timeout: 15_000 });
    const restoredBalanceStatCard = page.locator('div').filter({ hasText: /Net Balance/i }).filter({ hasText: /\+?\$\s*1,?000/i }).first();
    await expect(restoredBalanceStatCard).toBeVisible({ timeout: 15_000 });

    // 6. Apply "This Month" filter and verify current month entries visible
    const filterTrigger = page.getByRole('combobox', { name: /Filter by date period/i }).first();
    await expect(filterTrigger).toBeVisible();
    await filterTrigger.click();

    await page.getByRole('option', { name: /This Month/i }).click();
    await expect(page.getByText(incomeDescription).first()).toBeVisible({ timeout: 15_000 });
  });
});
